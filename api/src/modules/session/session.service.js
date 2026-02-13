const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');
const { QuestionService } = require('../question-bank/question.service');
const { SESSION_STATUS } = require('../../config/constants');

@Injectable()
class SessionService {
    constructor(prismaService, questionService) {
        this.prisma = prismaService;
        this.questionService = questionService;
    }

    /**
     * Start a new interview session
     */
    async startSession(userId, startDto) {
        const { domain, mode = 'Practice', difficulty = 'Medium', companyMode, timeLimit } = startDto;

        const session = await this.prisma.session.create({
            data: {
                userId,
                domain,
                mode,
                difficulty,
                companyMode,
                timeLimit,
                status: SESSION_STATUS.ACTIVE,
                metadata: {
                    askedQuestionIds: [],
                    currentTopic: null,
                    followUpDepth: 0,
                    lastEvaluation: null,
                    weakTopics: [],
                },
            },
        });

        return {
            sessionId: session.id,
            domain: session.domain,
            mode: session.mode,
            difficulty: session.difficulty,
            companyMode: session.companyMode,
            timeLimit: session.timeLimit,
            message: `Interview session started for ${domain}`,
        };
    }

    /**
     * Get next question for the session
     */
    async getNextQuestion(sessionId) {
        const session = await this.getActiveSession(sessionId);
        const metadata = session.metadata || {};
        const askedQuestionIds = metadata.askedQuestionIds || [];

        // Check if we've hit the question limit
        if (session.questionsAsked >= 10) {
            return {
                message: 'Maximum questions reached. Please end the session.',
                shouldEnd: true,
                questionsAsked: session.questionsAsked,
            };
        }

        // Select next question using smart selection
        const question = await this.questionService.selectNextQuestion({
            domain: session.domain,
            difficulty: session.difficulty,
            askedQuestionIds,
            currentTopic: metadata.currentTopic,
            weakTopics: metadata.weakTopics,
        });

        if (!question) {
            return {
                message: 'No more questions available for this session',
                shouldEnd: true,
                questionsAsked: session.questionsAsked,
            };
        }

        // Update session metadata
        await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                questionsAsked: session.questionsAsked + 1,
                metadata: {
                    ...metadata,
                    askedQuestionIds: [...askedQuestionIds, question.id],
                    currentQuestionId: question.id,
                    currentTopic: question.topic,
                },
            },
        });

        return {
            questionNumber: session.questionsAsked + 1,
            questionId: question.id,
            question: question.text,
            topic: question.topic,
            difficulty: question.difficulty,
            domain: question.domain,
            hints: question.hints,
            tags: question.tags,
        };
    }

    /**
     * Submit answer for evaluation (evaluation logic will be in evaluator service)
     */
    async submitAnswer(submitDto) {
        const { sessionId, questionId, answer, responseTimeMs } = submitDto;

        const session = await this.getActiveSession(sessionId);
        const question = await this.questionService.getQuestionById(questionId);

        // Create session event (score will be updated by evaluator)
        const event = await this.prisma.sessionEvent.create({
            data: {
                sessionId,
                questionId,
                questionNumber: session.questionsAsked,
                userAnswer: answer,
                score: 0, // Will be calculated by evaluator
                evaluation: {
                    status: 'pending',
                    covered: [],
                    missing: [],
                    wrongClaims: [],
                },
                responseTimeMs,
            },
        });

        return {
            eventId: event.id,
            questionId,
            questionNumber: session.questionsAsked,
            message: 'Answer submitted successfully',
            // Placeholder - will be replaced by actual evaluation
            feedback: {
                status: 'submitted',
                note: 'Evaluation will be processed',
            },
        };
    }

    /**
     * End the interview session
     */
    async endSession(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: { events: true },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Calculate total score
        const scores = session.events.map((e) => e.score).filter((s) => s > 0);
        const totalScore = scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : 0;

        const updatedSession = await this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: SESSION_STATUS.COMPLETED,
                endTime: new Date(),
                totalScore,
            },
        });

        const durationMs = new Date() - new Date(session.startTime);

        return {
            sessionId: updatedSession.id,
            status: 'completed',
            totalScore: Math.round(totalScore * 10) / 10,
            questionsAnswered: session.events.length,
            duration: Math.round(durationMs / 1000), // seconds
            domain: session.domain,
        };
    }

    /**
     * Get session details
     */
    async getSession(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                events: {
                    include: { question: { select: { text: true, topic: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                user: { select: { name: true, email: true } },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        return session;
    }

    /**
     * Get user's session history
     */
    async getUserSessions(userId, limit = 10, offset = 0) {
        const [sessions, total] = await Promise.all([
            this.prisma.session.findMany({
                where: { userId },
                orderBy: { startTime: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    domain: true,
                    mode: true,
                    difficulty: true,
                    status: true,
                    totalScore: true,
                    questionsAsked: true,
                    startTime: true,
                    endTime: true,
                },
            }),
            this.prisma.session.count({ where: { userId } }),
        ]);

        return { sessions, total, limit, offset };
    }

    /**
     * Abandon a session
     */
    async abandonSession(sessionId) {
        const session = await this.getActiveSession(sessionId);

        return this.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: SESSION_STATUS.ABANDONED,
                endTime: new Date(),
            },
        });
    }

    /**
     * Helper: Get active session or throw
     */
    async getActiveSession(sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status !== SESSION_STATUS.ACTIVE) {
            throw new BadRequestException('Session is not active');
        }

        return session;
    }
}

module.exports = { SessionService };
