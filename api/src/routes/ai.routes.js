/**
 * AI Routes - LLM-powered evaluation endpoints
 * 
 * These routes provide AI-powered capabilities:
 * - Rubric generation
 * - Answer evaluation (LLM-based)
 * - Follow-up question generation
 * - Study roadmap generation
 */

const express = require('express');
const { prisma } = require('../db/prisma');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');
const { llmService } = require('../services/llm.service');
const { evaluationService } = require('../services/evaluation.service');
const { hybridEvaluationService } = require('../services/hybrid-evaluation.service');

const router = express.Router();

// ============= HEALTH CHECK =============

/**
 * GET /api/ai/health
 * Check LLM provider health
 */
router.get('/health', asyncHandler(async (req, res) => {
    const health = await llmService.healthCheck();

    res.json({
        success: true,
        data: health,
    });
}));

// ============= RUBRIC GENERATION =============

/**
 * POST /api/ai/rubric/generate
 * Generate a rubric for a question using LLM
 * 
 * Body: { questionId } or { question: { text, domain, topic, difficulty } }
 */
router.post('/rubric/generate', asyncHandler(async (req, res) => {
    const { questionId, question: inlineQuestion } = req.body;

    let question;

    if (questionId) {
        // Fetch question from database
        question = await prisma.question.findUnique({
            where: { id: questionId },
            include: { rubric: true },
        });

        if (!question) {
            throw new ApiError('Question not found', 404);
        }
    } else if (inlineQuestion) {
        // Use inline question
        if (!inlineQuestion.text || !inlineQuestion.domain) {
            throw new ApiError('Inline question requires text and domain', 400);
        }
        question = inlineQuestion;
    } else {
        throw new ApiError('Either questionId or question object required', 400);
    }

    // Generate rubric using LLM
    const rubric = await evaluationService.generateRubric(question);

    // If we have a questionId, optionally save the rubric
    if (questionId && req.query.save === 'true') {
        await prisma.rubric.upsert({
            where: { questionId },
            create: {
                questionId,
                ...rubric,
            },
            update: rubric,
        });
    }

    res.json({
        success: true,
        data: {
            rubric,
            question: {
                id: question.id,
                text: question.text,
                domain: question.domain,
            },
        },
    });
}));

// ============= ANSWER EVALUATION =============

/**
 * POST /api/ai/evaluate
 * Evaluate an answer using LLM
 * 
 * Body: { questionId, answer } or { question, answer, rubric }
 */
router.post('/evaluate', asyncHandler(async (req, res) => {
    const { questionId, question: inlineQuestion, answer, rubric: inlineRubric } = req.body;

    if (!answer) {
        throw new ApiError('Answer is required', 400);
    }

    let question;
    let rubric;

    if (questionId) {
        // Fetch question with rubric from database
        question = await prisma.question.findUnique({
            where: { id: questionId },
            include: { rubric: true },
        });

        if (!question) {
            throw new ApiError('Question not found', 404);
        }

        rubric = question.rubric;

        if (!rubric) {
            throw new ApiError('Question has no rubric. Generate one first with /api/ai/rubric/generate', 400);
        }
    } else if (inlineQuestion && inlineRubric) {
        question = inlineQuestion;
        rubric = inlineRubric;
    } else {
        throw new ApiError('Either questionId or (question + rubric) required', 400);
    }

    // Evaluate using LLM
    const evaluation = await evaluationService.evaluateAnswer(question, answer, rubric);

    res.json({
        success: true,
        data: {
            score: evaluation.score,
            pointsCovered: evaluation.pointsCovered,
            pointsMissed: evaluation.pointsMissed,
            bonusPointsCovered: evaluation.bonusPointsCovered,
            redFlagsTriggered: evaluation.redFlagsTriggered,
            confidence: evaluation.confidence,
            assessment: evaluation.overallAssessment,
        },
    });
}));

// ============= FULL EVALUATION PIPELINE =============

/**
 * POST /api/ai/evaluate/full
 * Full evaluation pipeline: evaluate + feedback + follow-up
 * 
 * Body: { questionId, answer, includeFollowUp? }
 */
router.post('/evaluate/full', asyncHandler(async (req, res) => {
    const { questionId, answer, includeFollowUp = true, followUpDepth = 1 } = req.body;

    if (!questionId || !answer) {
        throw new ApiError('questionId and answer are required', 400);
    }

    // Fetch question with rubric
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { rubric: true },
    });

    if (!question) {
        throw new ApiError('Question not found', 404);
    }

    if (!question.rubric) {
        throw new ApiError('Question has no rubric', 400);
    }

    // Run full evaluation pipeline
    const result = await evaluationService.fullEvaluation(
        question,
        answer,
        question.rubric,
        { includeFollowUp, followUpDepth }
    );

    res.json({
        success: true,
        data: {
            evaluation: {
                score: result.evaluation.score,
                pointsCovered: result.evaluation.pointsCovered,
                pointsMissed: result.evaluation.pointsMissed,
                bonusPointsCovered: result.evaluation.bonusPointsCovered,
                redFlagsTriggered: result.evaluation.redFlagsTriggered,
            },
            feedback: result.feedback,
            followUp: result.followUp,
            timestamp: result.timestamp,
        },
    });
}));

// ============= FOLLOW-UP QUESTIONS =============

/**
 * POST /api/ai/follow-up
 * Generate a follow-up question
 * 
 * Body: { questionId, answer, evaluation, depth? }
 */
router.post('/follow-up', asyncHandler(async (req, res) => {
    const { questionId, answer, evaluation, depth = 1 } = req.body;

    if (!questionId || !answer) {
        throw new ApiError('questionId and answer are required', 400);
    }

    // Fetch question
    const question = await prisma.question.findUnique({
        where: { id: questionId },
    });

    if (!question) {
        throw new ApiError('Question not found', 404);
    }

    // Use provided evaluation or create minimal one
    const evalData = evaluation || {
        score: 50,
        pointsCovered: [],
        pointsMissed: [],
    };

    const followUp = await evaluationService.generateFollowUp(question, answer, evalData, depth);

    res.json({
        success: true,
        data: followUp,
    });
}));

// ============= STUDY ROADMAP =============

/**
 * POST /api/ai/roadmap
 * Generate personalized study roadmap
 * 
 * Body: { userId } or inline userProfile
 */
router.post('/roadmap', asyncHandler(async (req, res) => {
    const { userId, userProfile: inlineProfile } = req.body;

    let userProfile;

    if (userId) {
        // Build profile from user's session history
        const sessions = await prisma.session.findMany({
            where: { userId },
            include: {
                events: {
                    include: { question: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        if (sessions.length === 0) {
            throw new ApiError('No session history found for user', 404);
        }

        // Calculate stats
        const allEvents = sessions.flatMap(s => s.events);
        const totalScore = allEvents.reduce((sum, e) => sum + (e.score || 0), 0);
        const avgScore = allEvents.length > 0 ? totalScore / allEvents.length : 0;

        // Group by topic
        const topicScores = {};
        allEvents.forEach(e => {
            const key = `${e.question.domain}/${e.question.topic}`;
            if (!topicScores[key]) {
                topicScores[key] = { domain: e.question.domain, topic: e.question.topic, scores: [] };
            }
            topicScores[key].scores.push(e.score || 0);
        });

        // Calculate weak and strong topics
        const topics = Object.values(topicScores).map(t => ({
            domain: t.domain,
            topic: t.topic,
            score: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
        }));

        topics.sort((a, b) => a.score - b.score);

        userProfile = {
            overallScore: Math.round(avgScore),
            totalSessions: sessions.length,
            questionsAttempted: allEvents.length,
            weakTopics: topics.slice(0, 3),
            strongTopics: topics.slice(-3).reverse(),
            mistakePatterns: ['Incomplete explanations', 'Missing edge cases'],
        };
    } else if (inlineProfile) {
        userProfile = inlineProfile;
    } else {
        throw new ApiError('Either userId or userProfile required', 400);
    }

    const roadmap = await evaluationService.generateRoadmap(userProfile);

    res.json({
        success: true,
        data: roadmap,
    });
}));

// ============= FEEDBACK GENERATION =============

/**
 * POST /api/ai/feedback
 * Generate feedback for an answer
 * 
 * Body: { questionId, answer, evaluation }
 */
router.post('/feedback', asyncHandler(async (req, res) => {
    const { questionId, answer, evaluation } = req.body;

    if (!questionId || !answer || !evaluation) {
        throw new ApiError('questionId, answer, and evaluation are required', 400);
    }

    const question = await prisma.question.findUnique({
        where: { id: questionId },
    });

    if (!question) {
        throw new ApiError('Question not found', 404);
    }

    const feedback = await evaluationService.generateFeedback(question, answer, evaluation);

    res.json({
        success: true,
        data: feedback,
    });
}));

// ============= HYBRID EVALUATION (10-STEP PIPELINE) =============

/**
 * POST /api/ai/evaluate/hybrid
 * Full hybrid evaluation pipeline with semantic matching and deterministic scoring
 * 
 * This is the production-grade evaluation that:
 * 1. Extracts claims from answer using LLM
 * 2. Matches claims to rubric using embeddings
 * 3. Calculates score deterministically
 * 4. Generates feedback using LLM
 * 5. Determines next action (policy engine)
 * 6. Updates skill profile
 * 
 * Body: { questionId, answer, sessionId?, responseTimeMs? }
 */
router.post('/evaluate/hybrid', asyncHandler(async (req, res) => {
    const { questionId, answer, sessionId, responseTimeMs, questionNumber } = req.body;
    const userId = req.headers['x-user-id'] || null;

    if (!questionId || !answer) {
        throw new ApiError('questionId and answer are required', 400);
    }

    // Get session state if session provided
    let sessionState = {};
    if (sessionId) {
        const recentEvents = await prisma.sessionEvent.findMany({
            where: { sessionId },
            include: { question: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });

        sessionState = {
            recentScores: recentEvents.map(e => ({
                topic: e.question.topic,
                score: e.score / 10, // Normalize to 0-10
            })),
            currentTopic: recentEvents[0]?.question?.topic,
            followUpDepth: recentEvents.filter(e => e.isFollowUp).length,
        };
    }

    // Run hybrid evaluation pipeline
    const result = await hybridEvaluationService.evaluate(questionId, answer, {
        sessionId,
        userId,
        responseTimeMs,
        questionNumber,
        sessionState,
    });

    res.json({
        success: true,
        data: {
            score: result.score,
            scoreBreakdown: result.scoreBreakdown,
            coverage: result.coverage,
            claims: result.claims,
            wrongClaims: result.wrongClaims,
            triggeredRedFlags: result.triggeredRedFlags.map(r => r.redFlag || r),
            answerQuality: result.answerQuality,
            feedback: result.feedback,
            nextAction: result.nextAction,
            skillUpdate: result.skillUpdate,
            eventId: result.eventId,
            question: result.question,
        },
    });
}));

/**
 * GET /api/ai/skills/:userId
 * Get user's skill profile
 */
router.get('/skills/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const skills = await prisma.skillProfile.findMany({
        where: { userId },
        orderBy: { masteryScore: 'desc' },
    });

    const summary = {
        totalTopics: skills.length,
        averageMastery: skills.length > 0
            ? Math.round(skills.reduce((sum, s) => sum + s.masteryScore, 0) / skills.length)
            : 0,
        strongestTopics: skills.slice(0, 3).map(s => ({
            domain: s.domain,
            topic: s.topic,
            mastery: Math.round(s.masteryScore),
        })),
        weakestTopics: skills.slice(-3).reverse().map(s => ({
            domain: s.domain,
            topic: s.topic,
            mastery: Math.round(s.masteryScore),
        })),
    };

    res.json({
        success: true,
        data: {
            skills: skills.map(s => ({
                domain: s.domain,
                topic: s.topic,
                mastery: Math.round(s.masteryScore),
                questionsSeen: s.questionsSeen,
                avgScore: Math.round(s.avgScore),
                lastPracticed: s.lastSeen,
                trend: s.trend,
            })),
            summary,
        },
    });
}));

module.exports = router;
