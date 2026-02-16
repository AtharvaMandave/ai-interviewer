/**
 * Interview Routes
 * 
 * RESTful API for interview session management via Orchestrator.
 * These are the main endpoints for the interview flow.
 * 
 * IMPORTANT: Static routes MUST come before dynamic :sessionId routes!
 */

const express = require('express');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');
const { orchestratorService } = require('../services/orchestrator.service');
const { interviewerService } = require('../services/interviewer.service');
const multer = require('multer');
const { extractTextFromFile } = require('../utils/fileParser');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// ============= STATIC ROUTES (MUST BE FIRST) =============

/**
 * GET /api/interview/domains
 * Get all available domains
 */
router.get('/domains', asyncHandler(async (req, res) => {
    const { prisma } = require('../db/prisma');

    const domains = await prisma.question.findMany({
        where: { isActive: true },
        select: { domain: true },
        distinct: ['domain'],
    });

    const domainList = domains.map(d => d.domain);

    // Get count per domain
    const counts = await prisma.question.groupBy({
        by: ['domain'],
        where: { isActive: true },
        _count: { id: true },
    });

    const domainInfo = domainList.map(domain => ({
        domain,
        questionCount: counts.find(c => c.domain === domain)?._count?.id || 0,
    }));

    res.json({
        success: true,
        data: domainInfo,
    });
}));

/**
 * POST /api/interview/parse-resume
 * Parse resume file (PDF/DOCX/TXT) and return text
 */
router.post('/parse-resume', upload.single('resume'), asyncHandler(async (req, res) => {
    console.log('[API] /parse-resume hit');

    if (!req.file) {
        console.error('[API] No file received');
        throw new ApiError('No file uploaded', 400);
    }

    console.log('[API] File received:', req.file.originalname, req.file.mimetype, req.file.size);

    // Check type if multer didn't already
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
        console.error('[API] Invalid mime type:', req.file.mimetype);
        throw new ApiError(`Invalid file type: ${req.file.mimetype}. Only PDF, DOCX, and TXT allowed.`, 400);
    }

    try {
        console.log('[API] Extracting text...');
        const text = await extractTextFromFile(req.file);
        console.log('[API] Text extracted, length:', text.length);

        // Basic cleanup
        const cleanText = text.replace(/\s+/g, ' ').trim();

        res.json({
            success: true,
            data: {
                text: cleanText,
                fileName: req.file.originalname,
                size: req.file.size
            },
        });
    } catch (e) {
        console.error('[API] Extraction error:', e);
        throw new ApiError(`Failed to parse file: ${e.message}`, 500);
    }
}));

/**
 * GET /api/interview/topics/:domain
 * Get available topics for a domain
 */
router.get('/topics/:domain', asyncHandler(async (req, res) => {
    const { domain } = req.params;

    const topics = await interviewerService.getAvailableTopics(domain);

    res.json({
        success: true,
        data: { domain, topics },
    });
}));

/**
 * GET /api/interview/companies
 * Get all companies that have tagged questions
 */
router.get('/companies', asyncHandler(async (req, res) => {
    const { prisma } = require('../db/prisma');

    const questions = await prisma.question.findMany({
        where: { isActive: true },
        select: { companyTags: true },
    });

    // Flatten all company tags and count occurrences
    const companyCounts = {};
    questions.forEach(q => {
        (q.companyTags || []).forEach(tag => {
            companyCounts[tag] = (companyCounts[tag] || 0) + 1;
        });
    });

    const data = Object.entries(companyCounts)
        .map(([company, questionCount]) => ({ company, questionCount }))
        .sort((a, b) => b.questionCount - a.questionCount);

    res.json({
        success: true,
        data,
    });
}));

/**
 * POST /api/interview/analyze-resume
 * Analyze resume text and extract skills, domains, experience
 */
router.post('/analyze-resume', asyncHandler(async (req, res) => {
    const { resumeText } = req.body;

    if (!resumeText || resumeText.trim().length < 50) {
        throw new ApiError('Resume text is too short. Please paste your full resume.', 400);
    }

    const { llmService } = require('../services/llm.service');
    const { prisma } = require('../db/prisma');

    // Get available domains from question bank
    const domains = await prisma.question.findMany({
        where: { isActive: true },
        select: { domain: true },
        distinct: ['domain'],
    });
    const availableDomains = domains.map(d => d.domain);

    const prompt = `Analyze the following resume and extract structured information for an interview preparation system.

RESUME TEXT:
"""
${resumeText.substring(0, 3000)}
"""

AVAILABLE INTERVIEW DOMAINS: ${availableDomains.join(', ')}

Extract the following and respond with JSON:
{
  "skills": ["list of technical skills found"],
  "domains": ["matching domains from the available list above - ONLY pick from the available domains"],
  "experience": "Fresher|1-3 years|3-5 years|5+ years",
  "suggestedDifficulty": "Easy|Medium|Hard",
  "projects": ["notable project names from resume"],
  "strengths": ["top 3 strength areas"],
  "focusAreas": ["areas that need more preparation based on resume gaps"]
}

IMPORTANT: Only include domains that match the AVAILABLE INTERVIEW DOMAINS list.`;

    try {
        const result = await llmService.generateJSON(prompt, {
            temperature: 0.3,
            maxTokens: 800,
        });

        res.json({
            success: true,
            data: {
                skills: result.skills || [],
                domains: (result.domains || []).filter(d => availableDomains.includes(d)),
                experience: result.experience || 'Fresher',
                suggestedDifficulty: result.suggestedDifficulty || 'Medium',
                projects: result.projects || [],
                strengths: result.strengths || [],
                focusAreas: result.focusAreas || [],
            },
        });
    } catch (error) {
        console.error('[Interview] Resume analysis failed:', error.message);
        // Fallback: simple keyword matching
        const lowerText = resumeText.toLowerCase();
        const matchedDomains = availableDomains.filter(d =>
            lowerText.includes(d.toLowerCase())
        );

        res.json({
            success: true,
            data: {
                skills: [],
                domains: matchedDomains.length > 0 ? matchedDomains : availableDomains.slice(0, 2),
                experience: 'Fresher',
                suggestedDifficulty: 'Medium',
                projects: [],
                strengths: [],
                focusAreas: [],
            },
        });
    }
}));


/**
 * POST /api/interview/plan
 * Generate a structured interview plan from resume analysis
 * 
 * Body: { resumeAnalysis, position? }
 */
router.post('/plan', asyncHandler(async (req, res) => {
    const { resumeAnalysis, position } = req.body;
    const { llmService } = require('../services/llm.service');

    if (!resumeAnalysis) {
        throw new ApiError('Resume analysis is required', 400);
    }

    const plan = await llmService.generateInterviewPlan(resumeAnalysis, position);

    res.json({
        success: true,
        data: plan,
    });
}));

/**
 * POST /api/interview/report
 * Generate a hiring report for a session
 * 
 * Body: { sessionId }
 */
router.post('/:sessionId/report', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { prisma } = require('../db/prisma');
    const { llmService } = require('../services/llm.service');

    // Get session with full history
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
            events: {
                include: { question: true },
                orderBy: { createdAt: 'asc' },
            },
            user: true,
            report: true
        },
    });

    if (!session) {
        throw new ApiError('Session not found', 404);
    }

    // Return existing report if available
    if (session.report) {
        return res.json({
            success: true,
            data: session.report,
        });
    }

    // Prepare session data for LLM
    const sessionData = {
        candidate: session.user.name,
        position: 'Software Engineer', // Could be dynamic
        domain: session.domain,
        difficulty: session.difficulty,
        mode: session.mode,
        questions: session.events.map(e => ({
            question: e.question.text,
            topic: e.question.topic,
            answer: e.userAnswer,
            score: e.score,
            evaluation: e.evaluation,
            feedback: e.feedback
        }))
    };

    // Generate report
    const reportData = await llmService.generateHiringReport(sessionData);

    // Save report
    const report = await prisma.report.create({
        data: {
            sessionId: session.id,
            overallScore: sessionData.questions.reduce((sum, q) => sum + q.score, 0) / (sessionData.questions.length || 1),
            topicBreakdown: reportData.topicBreakdown || {}, // Add if missing
            strengths: reportData.strengths || [],
            weaknesses: reportData.weaknesses || [],
            recommendations: reportData.summary ? [reportData.summary] : [],
            detailedAnalysis: reportData // Store full JSON
        }
    });

    res.json({
        success: true,
        data: report,
    });
}));

/**
 * POST /api/interview/start
 * Start a new interview session
 * 
 * Body: { userId, domain, mode?, difficulty?, companyMode?, timeLimit?, questionLimit? }
 */
router.post('/start', asyncHandler(async (req, res) => {
    const {
        userId,
        domain,
        mode = 'Practice',
        difficulty = 'Medium',
        companyMode,
        timeLimit,
        questionLimit,
        resumeContext,
        interviewPlan,
        roleConfig,
        adaptiveMode,
        topic
    } = req.body;

    if (!userId || !domain) {
        throw new ApiError('userId and domain are required', 400);
    }

    const result = await orchestratorService.startSession({
        userId,
        domain,
        mode,
        difficulty,
        companyMode,
        timeLimit,
        questionLimit,
        resumeContext,
        interviewPlan,
        roleConfig,
        adaptiveMode,
        topic
    });

    res.json({
        success: true,
        data: result,
    });
}));

// ============= DYNAMIC SESSION ROUTES =============

/**
 * GET /api/interview/:sessionId
 * Get session status and current state
 */
router.get('/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const { prisma } = require('../db/prisma');

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

    if (!session) {
        throw new ApiError('Session not found', 404);
    }

    const state = orchestratorService.reconstructState(session);

    res.json({
        success: true,
        data: {
            session: {
                id: session.id,
                domain: session.domain,
                mode: session.mode,
                difficulty: session.difficulty,
                status: session.status,
                startTime: session.startTime,
                questionsAsked: session.questionsAsked,
            },
            state: orchestratorService.getPublicState(state),
            currentQuestion: session.events[0]?.question
                ? orchestratorService.formatQuestion(session.events[0].question, state.questionNumber)
                : null,
        },
    });
}));

/**
 * GET /api/interview/:sessionId/question
 * Get the next question
 */
router.get('/:sessionId/question', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const result = await orchestratorService.getNextQuestion(sessionId);

    res.json({
        success: true,
        data: result,
    });
}));

/**
 * POST /api/interview/:sessionId/answer
 * Submit an answer and get evaluation
 * 
 * Body: { questionId, answer, responseTimeMs?, drawingData? }
 */
router.post('/:sessionId/answer', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { questionId, answer, responseTimeMs, drawingData } = req.body;

    if (!questionId || !answer) {
        throw new ApiError('questionId and answer are required', 400);
    }

    const result = await orchestratorService.processAnswer(sessionId, {
        questionId,
        answer,
        responseTimeMs,
        drawingData,
    });

    res.json({
        success: true,
        data: result,
    });
}));

/**
 * GET /api/interview/:sessionId/hint
 * Get a hint for the current question
 */
router.get('/:sessionId/hint', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const attemptNumber = parseInt(req.query.attempt) || 1;

    const hint = await orchestratorService.getHint(sessionId, attemptNumber);

    res.json({
        success: true,
        data: hint,
    });
}));

/**
 * POST /api/interview/:sessionId/end
 * End the session and get report
 */
router.post('/:sessionId/end', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const report = await orchestratorService.endSession(sessionId);

    res.json({
        success: true,
        data: report,
    });
}));

/**
 * POST /api/interview/:sessionId/abandon
 * Abandon the session
 */
router.post('/:sessionId/abandon', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const result = await orchestratorService.abandonSession(sessionId, reason);

    res.json({
        success: true,
        data: result,
    });
}));

/**
 * POST /api/interview/:sessionId/follow-up
 * Generate a follow-up question manually
 * 
 * Body: { focusArea? }
 */
router.post('/:sessionId/follow-up', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { focusArea } = req.body;

    const { prisma } = require('../db/prisma');

    // Get last question and evaluation
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
        throw new ApiError('No question to follow up on', 400);
    }

    const lastEvent = session.events[0];

    const followUp = await interviewerService.generateFollowUp({
        question: lastEvent.question,
        userAnswer: lastEvent.userAnswer,
        evaluation: lastEvent.evaluation,
        depth: (lastEvent.followUpDepth || 0) + 1,
        focusArea,
    });

    res.json({
        success: true,
        data: followUp,
    });
}));

module.exports = router;
