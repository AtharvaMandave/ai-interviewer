/**
 * Orchestrator Service
 * 
 * Main controller for interview session lifecycle:
 * - startSession() → Initialize state
 * - getNextQuestion() → Use policy + state
 * - processAnswer() → Evaluate + update state + decide next
 * - endSession() → Finalize + trigger report
 * 
 * Integrates InterviewerAgent and EvaluatorAgent
 */

const { prisma } = require('../db/prisma');
const { policyEngine } = require('./policy-engine.service');
const { hybridEvaluationService } = require('./hybrid-evaluation.service');
const { interviewerService } = require('./interviewer.service');

class OrchestratorService {

    // ============= SESSION LIFECYCLE =============

    /**
     * Start a new interview session
     */
    async startSession(options = {}) {
        const {
            userId,
            domain,
            mode = 'Practice',
            difficulty = 'Medium',
            companyMode = null,
            timeLimit = null,
            questionLimit = null,
        } = options;

        // Validate required fields
        if (!userId || !domain) {
            throw new Error('userId and domain are required');
        }

        // Ensure user exists (create demo user if needed)
        let user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            // Check if this is a demo user pattern
            if (userId.startsWith('demo-user-')) {
                user = await prisma.user.create({
                    data: {
                        id: userId,
                        name: 'Demo User',
                        email: `${userId}@demo.local`,
                        provider: 'demo',
                    },
                });
            } else {
                throw new Error(`User not found: ${userId}`);
            }
        }

        // Get policy rules for session limits
        const rules = policyEngine.getRules();
        const maxQuestions = questionLimit || rules.sessionLimits.maxQuestions;
        const maxDuration = timeLimit || rules.sessionLimits.maxDurationMinutes;

        // Create session in database
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                domain,
                mode,
                difficulty,
                companyMode,
                status: 'active',
                timeLimit: maxDuration * 60, // Convert to seconds
                metadata: {
                    maxQuestions,
                    startDifficulty: difficulty,
                    policyVersion: 'v1',
                },
            },
        });

        // Initialize session state (in-memory, could use Redis)
        const state = this.initializeState(session, {
            maxQuestions,
            userId,
            domain,
            difficulty,
        });

        // Get first question
        const firstQuestion = await interviewerService.selectQuestion({
            domain,
            difficulty,
            excludeIds: [],
            userId,
        });

        if (!firstQuestion) {
            throw new Error(`No questions available for domain: ${domain}`);
        }

        // Update state with first question
        state.currentQuestion = firstQuestion;
        state.askedQuestionIds.push(firstQuestion.id);
        state.currentTopic = firstQuestion.topic;

        return {
            session: {
                id: session.id,
                domain: session.domain,
                mode: session.mode,
                difficulty: session.difficulty,
                startTime: session.startTime,
                maxQuestions,
                timeLimit: maxDuration,
            },
            state: this.getPublicState(state),
            question: this.formatQuestion(firstQuestion, 1),
        };
    }

    /**
     * Initialize session state
     */
    initializeState(session, options = {}) {
        return {
            sessionId: session.id,
            userId: options.userId,
            domain: options.domain,
            currentDifficulty: options.difficulty || 'Medium',
            currentTopic: null,
            currentQuestion: null,
            questionNumber: 0,
            askedQuestionIds: [],
            askedTopics: [],
            recentScores: [],
            followUpDepth: 0,
            followUpParentId: null,
            sessionStartTime: session.startTime,
            lastPolicyDecision: null,
            totalScore: 0,
            maxQuestions: options.maxQuestions || 20,
            isEnded: false,
        };
    }

    /**
     * Get public state (safe to send to client)
     */
    getPublicState(state) {
        return {
            questionNumber: state.questionNumber,
            currentDifficulty: state.currentDifficulty,
            currentTopic: state.currentTopic,
            questionsRemaining: state.maxQuestions - state.questionNumber,
            followUpDepth: state.followUpDepth,
            averageScore: state.recentScores.length > 0
                ? Math.round(state.recentScores.reduce((s, r) => s + r.score, 0) / state.recentScores.length * 10) / 10
                : null,
        };
    }

    // ============= QUESTION FLOW =============

    /**
     * Get next question based on current state and policy
     */
    /**
     * Get next question based on current state and policy
     */
    async getNextQuestion(sessionId, currentState = null) {
        try {
            // Load session if state not provided
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                include: {
                    events: {
                        include: { question: true },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                },
            });

            if (!session) {
                throw new Error('Session not found');
            }

            if (session.status !== 'active') {
                throw new Error('Session is not active');
            }

            // Reconstruct state from session events if not provided
            const state = currentState || this.reconstructState(session);

            // Check if session should end
            const limitCheck = policyEngine.checkSessionLimits(
                state.questionNumber,
                state.sessionStartTime
            );

            if (limitCheck) {
                return {
                    action: 'end_session',
                    reason: limitCheck.reason,
                    state: this.getPublicState(state),
                };
            }

            // Get policy decision for next question
            const policyDecision = state.lastPolicyDecision || { action: 'continue' };

            let question;

            // Handle follow-up vs new question
            if (policyDecision.action === 'follow_up' ||
                policyDecision.action === 'follow_up_easy' ||
                policyDecision.action === 'follow_up_same') {

                // Generate follow-up question
                const lastEvaluation = state.lastEvaluation;

                // Ensure we have context for follow-up
                if (!state.currentQuestion || !state.lastAnswer) {
                    // Fallback to normal selection if context missing
                    console.warn(`[Orchestrator] Missing context for follow-up in session ${sessionId}. Falling back to standard selection.`);
                    question = await interviewerService.selectQuestionByPolicy(
                        state.domain,
                        { action: 'continue' }, // Reset to continue
                        state
                    );
                } else {
                    question = await interviewerService.generateFollowUp({
                        question: state.currentQuestion,
                        userAnswer: state.lastAnswer,
                        evaluation: lastEvaluation,
                        depth: state.followUpDepth + 1,
                    });

                    state.followUpDepth++;
                    state.followUpParentId = state.currentQuestion.id;
                }
            } else {
                // Select new question
                question = await interviewerService.selectQuestionByPolicy(
                    state.domain,
                    policyDecision,
                    state
                );

                if (!question) {
                    // Fallback to any question
                    question = await interviewerService.selectQuestion({
                        domain: state.domain,
                        excludeIds: state.askedQuestionIds,
                        userId: state.userId,
                    });
                }

                // Reset follow-up state
                state.followUpDepth = 0;
                state.followUpParentId = null;

                // Update topic if changed
                if (question && question.topic !== state.currentTopic) {
                    state.askedTopics.push(question.topic);
                    state.currentTopic = question.topic;
                }
            }

            if (!question) {
                // Determine why no question was found
                console.warn(`[Orchestrator] No question found for session ${sessionId}`);
                return {
                    action: 'end_session',
                    reason: 'No more questions available matching criteria',
                    state: this.getPublicState(state),
                };
            }

            // Update state
            state.questionNumber++;
            state.currentQuestion = question;
            if (!question.isFollowUp) {
                state.askedQuestionIds.push(question.id);
            }
            state.currentDifficulty = question.difficulty || state.currentDifficulty;

            return {
                action: 'question',
                question: this.formatQuestion(question, state.questionNumber),
                state: this.getPublicState(state),
                policyApplied: policyDecision,
            };
        } catch (error) {
            console.error(`[Orchestrator] Error in getNextQuestion for session ${sessionId}:`, error);
            throw error; // Re-throw to be handled by controller
        }
    }

    /**
     * Reconstruct session state from database
     */
    reconstructState(session) {
        const events = session.events || [];
        const recentScores = events.slice(0, 10).map(e => ({
            topic: e.question.topic,
            score: e.score / 10, // Normalize to 0-10
        }));

        return {
            sessionId: session.id,
            userId: session.userId,
            domain: session.domain,
            currentDifficulty: session.difficulty,
            currentTopic: (events[0] && events[0].question) ? events[0].question.topic : null,
            currentQuestion: (events[0] && events[0].question) ? events[0].question : null,
            questionNumber: events.length,
            askedQuestionIds: events.map(e => e.questionId),
            askedTopics: [...new Set(events.map(e => e.question.topic))],
            recentScores,
            followUpDepth: events[0]?.followUpDepth || 0,
            followUpParentId: events[0]?.parentEventId || null,
            sessionStartTime: session.startTime,
            lastPolicyDecision: null,
            totalScore: events.reduce((sum, e) => sum + e.score, 0),
            maxQuestions: session.metadata?.maxQuestions || 20,
            isEnded: session.status !== 'active',
        };
    }

    // ============= ANSWER PROCESSING =============

    /**
     * Process user's answer: evaluate + update state + decide next
     */
    async processAnswer(sessionId, options = {}) {
        const {
            questionId,
            answer,
            responseTimeMs,
            currentState = null,
        } = options;

        if (!answer || !questionId) {
            throw new Error('questionId and answer are required');
        }

        // Load session
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.status !== 'active') {
            throw new Error('Session not found or not active');
        }

        // Reconstruct or use provided state
        const sessionWithEvents = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                events: {
                    include: { question: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        const state = currentState || this.reconstructState(sessionWithEvents);

        // Run hybrid evaluation
        const evaluation = await hybridEvaluationService.evaluate(questionId, answer, {
            sessionId,
            userId: session.userId,
            responseTimeMs,
            questionNumber: state.questionNumber,
            sessionState: {
                recentScores: state.recentScores,
                currentTopic: state.currentTopic,
                currentDifficulty: state.currentDifficulty,
                followUpDepth: state.followUpDepth,
                sessionStartTime: state.sessionStartTime,
                questionNumber: state.questionNumber,
            },
        });

        // Update state with evaluation results
        state.recentScores.unshift({
            topic: state.currentTopic,
            score: evaluation.score,
        });
        state.recentScores = state.recentScores.slice(0, 10); // Keep last 10

        state.totalScore += evaluation.score;
        state.lastEvaluation = evaluation;
        state.lastAnswer = answer;
        state.lastPolicyDecision = evaluation.nextAction;

        // Update session stats in DB
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                questionsAsked: state.questionNumber,
                totalScore: state.totalScore / state.questionNumber * 10, // Normalize
            },
        });

        // Check if session should end
        const shouldEnd = evaluation.nextAction.action === 'end_session' ||
            state.questionNumber >= state.maxQuestions;

        if (shouldEnd) {
            const report = await this.endSession(sessionId, state);
            return {
                evaluation: this.formatEvaluation(evaluation),
                action: 'end_session',
                report,
                state: this.getPublicState(state),
            };
        }

        return {
            evaluation: this.formatEvaluation(evaluation),
            nextAction: evaluation.nextAction,
            state: this.getPublicState(state),
            feedback: evaluation.feedback,
        };
    }

    // ============= SESSION END =============

    /**
     * End session and generate report
     */
    async endSession(sessionId, currentState = null) {
        // Load full session data
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                events: {
                    include: { question: true },
                    orderBy: { createdAt: 'asc' },
                },
                user: true,
            },
        });

        if (!session) {
            throw new Error('Session not found');
        }

        const events = session.events;

        // Calculate overall statistics
        const totalScore = events.reduce((sum, e) => sum + e.score, 0);
        const averageScore = events.length > 0 ? totalScore / events.length : 0;
        const normalizedScore = averageScore / 10; // Convert to 0-10 scale

        // Group by topic
        const topicBreakdown = {};
        events.forEach(e => {
            const topic = e.question.topic;
            if (!topicBreakdown[topic]) {
                topicBreakdown[topic] = {
                    questions: 0,
                    totalScore: 0,
                    scores: [],
                };
            }
            topicBreakdown[topic].questions++;
            topicBreakdown[topic].totalScore += e.score;
            topicBreakdown[topic].scores.push(e.score);
        });

        // Calculate topic stats
        Object.keys(topicBreakdown).forEach(topic => {
            const t = topicBreakdown[topic];
            t.averageScore = Math.round(t.totalScore / t.questions) / 10;
            delete t.scores;
        });

        // Identify strengths and weaknesses
        const topicList = Object.entries(topicBreakdown)
            .map(([topic, data]) => ({ topic, ...data }))
            .sort((a, b) => b.averageScore - a.averageScore);

        const strengths = topicList
            .filter(t => t.averageScore >= 7)
            .slice(0, 3)
            .map(t => t.topic);

        const weaknesses = topicList
            .filter(t => t.averageScore < 5)
            .slice(0, 3)
            .map(t => t.topic);

        // Generate recommendations
        const recommendations = this.generateRecommendations(topicList, normalizedScore);

        // Create report
        const report = await prisma.report.create({
            data: {
                sessionId,
                overallScore: normalizedScore,
                topicBreakdown,
                strengths,
                weaknesses,
                recommendations,
                detailedAnalysis: {
                    questionsAttempted: events.length,
                    averageResponseTime: events.reduce((sum, e) => sum + (e.responseTimeMs || 0), 0) / events.length,
                    difficultyProgression: events.map(e => e.question.difficulty),
                },
            },
        });

        // Update session status
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'completed',
                endTime: new Date(),
                totalScore: normalizedScore,
            },
        });

        // Get classification from policy engine
        const classification = policyEngine.classifyScore(normalizedScore);

        return {
            reportId: report.id,
            overallScore: normalizedScore,
            grade: classification.grade,
            label: classification.label,
            questionsAttempted: events.length,
            topicBreakdown,
            strengths,
            weaknesses,
            recommendations,
            sessionDuration: Math.round((new Date() - new Date(session.startTime)) / 1000 / 60), // minutes
        };
    }

    /**
     * Abandon a session without generating a full report
     */
    async abandonSession(sessionId, reason = 'User abandoned') {
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'abandoned',
                endTime: new Date(),
                metadata: {
                    abandonReason: reason,
                },
            },
        });

        return { success: true, reason };
    }

    // ============= HELPERS =============

    /**
     * Format question for client
     */
    formatQuestion(question, questionNumber) {
        return {
            id: question.id,
            number: questionNumber,
            text: question.text,
            domain: question.domain,
            topic: question.topic,
            difficulty: question.difficulty,
            isFollowUp: question.isFollowUp || false,
            followUpDepth: question.followUpDepth || 0,
            hints: question.hints?.length || 0,
            companyTags: question.companyTags || [],
        };
    }

    /**
     * Format evaluation for client
     */
    formatEvaluation(evaluation) {
        return {
            score: evaluation.score,
            scoreBreakdown: evaluation.scoreBreakdown,
            coverage: evaluation.coverage,
            grade: policyEngine.classifyScore(evaluation.score),
            feedback: evaluation.feedback,
            claims: evaluation.claims?.length || 0,
            wrongClaims: evaluation.wrongClaims?.length || 0,
            redFlagsTriggered: evaluation.triggeredRedFlags?.length || 0,
        };
    }

    /**
     * Generate recommendations based on performance
     */
    generateRecommendations(topicList, overallScore) {
        const recommendations = [];

        if (overallScore < 5) {
            recommendations.push('Focus on building fundamental understanding before advancing to complex topics.');
        } else if (overallScore < 7) {
            recommendations.push('Good foundation! Work on filling knowledge gaps in weaker areas.');
        } else {
            recommendations.push('Excellent performance! Consider challenging yourself with more advanced topics.');
        }

        // Topic-specific recommendations
        const weakTopics = topicList.filter(t => t.averageScore < 5);
        if (weakTopics.length > 0) {
            recommendations.push(`Prioritize studying: ${weakTopics.map(t => t.topic).join(', ')}`);
        }

        const strongTopics = topicList.filter(t => t.averageScore >= 8);
        if (strongTopics.length > 0) {
            recommendations.push(`Strengths to leverage: ${strongTopics.map(t => t.topic).join(', ')}`);
        }

        return recommendations;
    }

    // ============= HINT SUPPORT =============

    /**
     * Get a hint for the current question
     */
    async getHint(sessionId, attemptNumber = 1) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                events: {
                    include: { question: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        if (!session || session.events.length === 0) {
            throw new Error('No active question found');
        }

        const currentQuestion = session.events[0].question;
        return interviewerService.generateHint(currentQuestion, attemptNumber);
    }
}

const orchestratorService = new OrchestratorService();

module.exports = { OrchestratorService, orchestratorService };
