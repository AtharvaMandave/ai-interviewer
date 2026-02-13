const express = require('express');
const { prisma } = require('../db/prisma');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');
const { llmService } = require('../services/llm.service');

const router = express.Router();

// ============= SESSION MANAGEMENT =============

/**
 * POST /api/session/start
 * Create a new interview session
 * 
 * Body: { domain, mode?, difficulty?, timeLimit? }
 * Returns: { sessionId, domain, mode, status, currentQuestion }
 */
router.post('/start', asyncHandler(async (req, res) => {
    const userIdHeader = req.headers['x-user-id'] || 'demo-user-id';
    const { domain, difficulty = 'Medium', mode = 'Practice', timeLimit, adaptiveMode = false, resumeContext, interviewPlan } = req.body;

    // Ensure user exists (or create demo user)
    const userId = await getOrCreateUser(userIdHeader);

    // Validate domain
    if (!domain) {
        throw new ApiError('Domain is required', 400);
    }

    const validDomains = ['DSA', 'Java', 'DBMS', 'OS', 'HR', 'React', 'C', 'CPP'];
    if (!validDomains.includes(domain)) {
        throw new ApiError(`Invalid domain. Must be one of: ${validDomains.join(', ')}`, 400);
    }

    // Create session
    const session = await prisma.session.create({
        data: {
            userId,
            domain,
            difficulty,
            mode,
            timeLimit,
            adaptiveMode,
            resumeContext: resumeContext || undefined,
            interviewPlan: interviewPlan || undefined,
            status: 'active',
            startTime: new Date(),
        },
    });

    let question;

    if (adaptiveMode) {
        // Prepare context for first question
        const context = {
            domain,
            currentTopic: null, // Let AI pick
            currentDifficulty: difficulty,
            resumeContext: resumeContext || null,
            planStage: interviewPlan?.stages?.[0]?.focus || 'Introduction',
        };

        // If we have a specific starting question in plan
        if (interviewPlan?.stages?.[0]?.suggestedQuestion) {
            // Create a pseudo-question/rubric for "Tell me about yourself"
            const qData = {
                domain,
                topic: 'Behavioral',
                difficulty: 'Easy',
                text: interviewPlan.stages[0].suggestedQuestion,
                rubric: {
                    mustHave: ['Clear introduction', 'Mentioned key experience', 'Professional demeanor'],
                    goodToHave: ['Mentioned projects', 'Showed enthusiasm'],
                    redFlags: ['Unclear speech', 'Negative attitude']
                },
                isGenerated: true,
                isActive: false // Don't show in public bank
            };

            // Save it
            const savedQ = await prisma.question.create({
                data: {
                    domain: qData.domain,
                    topic: qData.topic,
                    difficulty: qData.difficulty,
                    text: qData.text,
                    isGenerated: true,
                    isActive: false,
                    rubric: {
                        create: qData.rubric
                    }
                },
                include: { rubric: true }
            });
            question = savedQ;
        } else {
            // Generate first technical question
            const generated = await llmService.generateNextQuestion(context);

            // Persist
            const savedQ = await prisma.question.create({
                data: {
                    domain: domain,
                    topic: generated.topic || 'General',
                    difficulty: generated.difficulty || difficulty,
                    text: generated.text,
                    tags: generated.tags || [],
                    hints: generated.hints || [],
                    isGenerated: true,
                    isActive: false,
                    rubric: {
                        create: generated.rubric
                    }
                },
                include: { rubric: true }
            });
            question = savedQ;
        }
    } else {
        // Standard random question
        question = await getRandomQuestion(domain, difficulty, []);
    }

    res.status(201).json({
        success: true,
        data: {
            sessionId: session.id,
            domain: session.domain,
            mode: session.mode,
            difficulty: session.difficulty,
            status: session.status,
            startTime: session.startTime,
            currentQuestion: question ? formatQuestionForClient(question) : null,
            adaptiveMode: session.adaptiveMode,
        },
        message: 'Session started successfully',
    });
}));

/**
 * GET /api/session/:id/question
 * Get random question for the session (excludes already asked)
 * 
 * Returns: { question, questionNumber }
 */
router.get('/:id/question', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get session with asked questions
    const session = await prisma.session.findUnique({
        where: { id },
        include: {
            events: {
                include: { question: true },
                orderBy: { questionNumber: 'asc' }
            }
        },
    });

    if (!session) {
        throw new ApiError('Session not found', 404);
    }

    if (session.status !== 'active') {
        throw new ApiError('Session is not active', 400);
    }

    let question;

    if (session.adaptiveMode) {
        // AI Adaptive Logic
        const completedCount = session.events.length;
        const lastEvent = session.events[completedCount - 1];

        // Determine Plan Context
        let nextQuestionText = null;
        let nextFocus = null;
        let planStage = null;

        if (session.interviewPlan && session.interviewPlan.stages) {
            const stage = session.interviewPlan.stages[completedCount]; // 0-based index matches count
            if (stage) {
                // If the plan provides a specific string question (rare, usually for intro)
                if (stage.suggestedQuestion) {
                    nextQuestionText = stage.suggestedQuestion;
                }
                nextFocus = stage.focus ? `${stage.type}: ${stage.focus}` : stage.type;
                planStage = stage.type;
            } else {
                planStage = 'Wrap Up / Extension';
            }
        }

        // Prepare context
        const context = {
            domain: session.domain,
            currentTopic: nextFocus, // Prioritize plan focus
            currentDifficulty: session.difficulty,
            previousScore: lastEvent ? lastEvent.score : undefined,
            previousQuestion: lastEvent ? lastEvent.question.text : undefined,
            resumeContext: session.resumeContext,
            planStage: planStage
        };

        // Reuse "Tell me about yourself" if specifically requested in text
        if (nextQuestionText) {
            const qData = {
                domain: session.domain,
                topic: 'Behavioral',
                difficulty: 'Easy',
                text: nextQuestionText,
                rubric: {
                    mustHave: ['Professional', 'Relevant'],
                    goodToHave: ['Detailed', 'Structured'],
                    redFlags: ['Inappropriate']
                },
                isGenerated: true,
                isActive: false
            };
            question = await prisma.question.create({
                data: {
                    ...qData,
                    rubric: { create: qData.rubric }
                },
                include: { rubric: true }
            });
        } else {
            // Generate dynamic question
            const generated = await llmService.generateNextQuestion(context);

            question = await prisma.question.create({
                data: {
                    domain: session.domain,
                    topic: generated.topic || 'General',
                    difficulty: generated.difficulty || session.difficulty,
                    text: generated.text,
                    tags: generated.tags || [],
                    hints: generated.hints || [],
                    isGenerated: true,
                    isActive: false,
                    rubric: {
                        create: generated.rubric
                    }
                },
                include: { rubric: true }
            });
        }

    } else {
        // Standard random question (excluding already asked)
        const askedIds = session.events.map(e => e.questionId);
        question = await getRandomQuestion(session.domain, session.difficulty, askedIds);
    }

    if (!question) {
        // If still no question (e.g. standard bank exhausted), check if we can fallback to AI?
        // For now, return completion.
        return res.json({
            success: true,
            data: {
                question: null,
                message: 'No more questions available for this domain',
                sessionComplete: true,
            },
        });
    }

    res.json({
        success: true,
        data: {
            question: formatQuestionForClient(question),
            questionNumber: session.events.length + 1,
        },
    });
}));

/**
 * POST /api/session/:id/answer
 * Submit answer for a question (no AI evaluation yet - static scoring)
 * 
 * Body: { questionId, answer, responseTimeMs? }
 * Returns: { eventId, score, feedback, pointsCovered, pointsMissed }
 */
router.post('/:id/answer', asyncHandler(async (req, res) => {
    const { id: sessionId } = req.params;
    const { questionId, answer, responseTimeMs } = req.body;

    // Validate input
    if (!questionId || !answer) {
        throw new ApiError('questionId and answer are required', 400);
    }

    // Get session
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
        throw new ApiError('Session not found', 404);
    }
    if (session.status !== 'active') {
        throw new ApiError('Session is not active', 400);
    }

    // Get question with rubric
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { rubric: true },
    });
    if (!question) {
        throw new ApiError('Question not found', 404);
    }

    // Count existing events for question number
    const eventCount = await prisma.sessionEvent.count({ where: { sessionId } });

    // Static evaluation (keyword-based)
    const evaluation = evaluateAnswer(answer, question.rubric);

    // Save session event
    const event = await prisma.sessionEvent.create({
        data: {
            sessionId,
            questionId,
            questionNumber: eventCount + 1,
            userAnswer: answer,
            score: evaluation.score,
            evaluation: {
                covered: evaluation.pointsCovered,
                missing: evaluation.pointsMissed,
                wrongClaims: evaluation.redFlagsTriggered,
                confidence: evaluation.confidence,
            },
            feedback: evaluation.feedback,
            responseTimeMs: responseTimeMs || null,
        },
    });

    // Update session question count
    await prisma.session.update({
        where: { id: sessionId },
        data: { questionsAsked: eventCount + 1 },
    });

    res.json({
        success: true,
        data: {
            eventId: event.id,
            questionNumber: event.questionNumber,
            score: evaluation.score,
            maxScore: 100,
            feedback: evaluation.feedback,
            pointsCovered: evaluation.pointsCovered,
            pointsMissed: evaluation.pointsMissed,
            redFlagsTriggered: evaluation.redFlagsTriggered,
        },
        message: 'Answer submitted',
    });
}));

/**
 * POST /api/session/:id/end
 * End the session and get summary
 */
router.post('/:id/end', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get all events for session
    const events = await prisma.sessionEvent.findMany({
        where: { sessionId: id },
        include: { question: true },
        orderBy: { createdAt: 'asc' },
    });

    // Calculate scores
    const totalScore = events.reduce((sum, e) => sum + e.score, 0);
    const avgScore = events.length > 0 ? totalScore / events.length : 0;

    // Update session
    const session = await prisma.session.update({
        where: { id },
        data: {
            status: 'completed',
            endTime: new Date(),
            totalScore: avgScore,
        },
    });

    res.json({
        success: true,
        data: {
            sessionId: session.id,
            status: 'completed',
            questionsAnswered: events.length,
            totalScore: Math.round(totalScore),
            averageScore: Math.round(avgScore * 10) / 10,
            duration: session.endTime - session.startTime,
            events: events.map(e => ({
                questionNumber: e.questionNumber,
                questionText: e.question.text.substring(0, 100) + '...',
                score: e.score,
                feedback: e.feedback,
            })),
        },
        message: 'Session completed',
    });
}));

/**
 * POST /api/session/:id/abandon
 * Abandon the session
 */
router.post('/:id/abandon', asyncHandler(async (req, res) => {
    const session = await prisma.session.update({
        where: { id: req.params.id },
        data: {
            status: 'abandoned',
            endTime: new Date(),
        },
    });

    res.json({
        success: true,
        data: { sessionId: session.id, status: 'abandoned' },
    });
}));

/**
 * GET /api/session/:id
 * Get session details with all events
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const session = await prisma.session.findUnique({
        where: { id: req.params.id },
        include: {
            events: {
                include: { question: true },
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!session) {
        throw new ApiError('Session not found', 404);
    }

    res.json({
        success: true,
        data: {
            id: session.id,
            domain: session.domain,
            mode: session.mode,
            difficulty: session.difficulty,
            status: session.status,
            questionsAsked: session.questionsAsked,
            totalScore: session.totalScore,
            startTime: session.startTime,
            endTime: session.endTime,
            events: session.events.map(e => ({
                id: e.id,
                questionNumber: e.questionNumber,
                questionText: e.question.text,
                questionTopic: e.question.topic,
                userAnswer: e.userAnswer,
                score: e.score,
                feedback: e.feedback,
                evaluation: e.evaluation,
                responseTimeMs: e.responseTimeMs,
                createdAt: e.createdAt,
            })),
        },
    });
}));

/**
 * GET /api/session/user/history
 * Get user's session history
 */
router.get('/user/history', asyncHandler(async (req, res) => {
    const userId = req.headers['x-user-id'] || 'demo-user-id';
    const { limit = '10', offset = '0' } = req.query;

    const sessions = await prisma.session.findMany({
        where: { userId },
        include: {
            _count: { select: { events: true } },
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { startTime: 'desc' },
    });

    res.json({
        success: true,
        data: sessions.map(s => ({
            id: s.id,
            domain: s.domain,
            mode: s.mode,
            status: s.status,
            questionsAsked: s.questionsAsked,
            totalScore: s.totalScore,
            startTime: s.startTime,
            endTime: s.endTime,
        })),
        meta: {
            count: sessions.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
}));

// ============= HELPER FUNCTIONS =============

/**
 * Get or create a user (for demo purposes)
 */
async function getOrCreateUser(userId) {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        // Try to find by email pattern
        const email = `${userId}@demo.interview-coach.app`;
        user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Create demo user
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email,
                    name: 'Demo User',
                    provider: 'demo',
                },
            });
        }
    }

    return user.id;
}

/**
 * Get a random question from the database
 */
async function getRandomQuestion(domain, difficulty, excludeIds = []) {
    const where = { isActive: true, domain };
    if (difficulty && difficulty !== 'Any') {
        where.difficulty = difficulty;
    }
    if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
    }

    const count = await prisma.question.count({ where });
    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);
    return prisma.question.findFirst({
        where,
        include: { rubric: true },
        skip,
    });
}

/**
 * Format question for client (hide rubric details)
 */
function formatQuestionForClient(question) {
    return {
        id: question.id,
        domain: question.domain,
        topic: question.topic,
        subTopic: question.subTopic,
        difficulty: question.difficulty,
        text: question.text,
        tags: question.tags,
        hints: question.hints,
        hasRubric: !!question.rubric,
    };
}

/**
 * Static answer evaluation (keyword-based, no AI yet)
 * Returns normalized score 0-100
 */
function evaluateAnswer(answerText, rubric) {
    // No rubric - give neutral score
    if (!rubric) {
        return {
            score: 50,
            maxScore: 100,
            confidence: 0.5,
            feedback: 'No evaluation rubric available for this question.',
            pointsCovered: [],
            pointsMissed: [],
            redFlagsTriggered: [],
        };
    }

    const answerLower = answerText.toLowerCase();
    const pointsCovered = [];
    const pointsMissed = [];
    const redFlagsTriggered = [];

    let rawScore = 0;

    // Check must-have points (each worth ~12% of max when all present)
    const mustHaveWeight = 6;
    for (const point of rubric.mustHave || []) {
        const keywords = extractKeywords(point);
        const matched = keywords.some(kw => answerLower.includes(kw));
        if (matched) {
            pointsCovered.push(point);
            rawScore += mustHaveWeight;
        } else {
            pointsMissed.push(point);
        }
    }

    // Check good-to-have points (each worth ~6% bonus)
    const goodToHaveWeight = 3;
    for (const point of rubric.goodToHave || []) {
        const keywords = extractKeywords(point);
        const matched = keywords.some(kw => answerLower.includes(kw));
        if (matched) {
            pointsCovered.push(point);
            rawScore += goodToHaveWeight;
        }
    }

    // Check red flags (penalty)
    const redFlagPenalty = 1.5;
    for (const flag of rubric.redFlags || []) {
        const keywords = extractKeywords(flag);
        const matched = keywords.some(kw => answerLower.includes(kw));
        if (matched) {
            redFlagsTriggered.push(flag);
            rawScore -= redFlagPenalty;
        }
    }

    // Calculate max possible score
    const maxPossible = (rubric.mustHave?.length || 0) * mustHaveWeight +
        (rubric.goodToHave?.length || 0) * goodToHaveWeight;

    // Normalize to 0-100
    const normalizedScore = maxPossible > 0
        ? Math.max(0, Math.min(100, (rawScore / maxPossible) * 100))
        : 50;

    // Calculate confidence based on rubric completeness
    const confidence = rubric.mustHave?.length >= 3 ? 0.8 : 0.5;

    // Generate feedback
    const feedback = generateFeedback(normalizedScore, pointsCovered.length, pointsMissed.length);

    return {
        score: Math.round(normalizedScore),
        maxScore: 100,
        confidence,
        feedback,
        pointsCovered,
        pointsMissed,
        redFlagsTriggered,
    };
}

/**
 * Extract keywords from a rubric point
 */
function extractKeywords(text) {
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'use', 'using', 'when', 'what', 'how', 'why', 'should', 'must', 'can', 'will', 'would', 'could'];
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));
}

/**
 * Generate feedback based on score
 */
function generateFeedback(score, covered, missed) {
    if (score >= 85) {
        return `Excellent answer! You covered ${covered} key points comprehensively.`;
    } else if (score >= 70) {
        return `Good answer. You covered ${covered} points. Consider elaborating on ${missed} more areas.`;
    } else if (score >= 50) {
        return `Fair attempt. You addressed ${covered} points but missed ${missed} important concepts. Review this topic.`;
    } else if (score >= 30) {
        return `Needs improvement. You missed several key concepts. Study this topic more thoroughly.`;
    } else {
        return `This answer needs significant work. Please review the fundamentals of this topic.`;
    }
}

module.exports = router;
