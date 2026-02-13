const {
    Controller,
    Get,
    Post,
    HttpCode,
    HttpStatus,
} = require('@nestjs/common');
const { SessionService } = require('./session.service');
const { ApiResponse } = require('../../common/types/api-response');

/**
 * Session Controller
 * Handles interview session lifecycle
 */
class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }

    /**
     * Start a new interview session
     * POST /session/start
     */
    async start(req, res) {
        const userId = req.headers['x-user-id'] || 'demo-user-id';
        const result = await this.sessionService.startSession(userId, req.body);
        return ApiResponse.success(result, 'Session started successfully');
    }

    /**
     * Get next question for the session
     * POST /session/next-question
     */
    async getNextQuestion(req, res) {
        const { sessionId } = req.body;
        const result = await this.sessionService.getNextQuestion(sessionId);
        return ApiResponse.success(result);
    }

    /**
     * Submit answer for evaluation
     * POST /session/submit-answer
     */
    async submitAnswer(req, res) {
        const result = await this.sessionService.submitAnswer(req.body);
        return ApiResponse.success(result, 'Answer submitted');
    }

    /**
     * End the interview session
     * POST /session/end
     */
    async endSession(req, res) {
        const { sessionId } = req.body;
        const result = await this.sessionService.endSession(sessionId);
        return ApiResponse.success(result, 'Session completed');
    }

    /**
     * Abandon the session
     * POST /session/abandon
     */
    async abandonSession(req, res) {
        const { sessionId } = req.body;
        const result = await this.sessionService.abandonSession(sessionId);
        return ApiResponse.success({ sessionId: result.id, status: 'abandoned' });
    }

    /**
     * Get session details
     * GET /session/:id
     */
    async getSession(req, res) {
        const result = await this.sessionService.getSession(req.params.id);
        return ApiResponse.success(result);
    }

    /**
     * Get user's session history
     * GET /session/user/history
     */
    async getUserHistory(req, res) {
        const userId = req.headers['x-user-id'] || 'demo-user-id';
        const { limit, offset } = req.query;
        const result = await this.sessionService.getUserSessions(
            userId,
            parseInt(limit) || 10,
            parseInt(offset) || 0,
        );
        return ApiResponse.success(result);
    }
}

// Apply decorators manually
Reflect.decorate([Controller('session')], SessionController);

const decorateMethod = (decorator, methodName) => {
    Reflect.decorate(
        [decorator],
        SessionController.prototype,
        methodName,
        Object.getOwnPropertyDescriptor(SessionController.prototype, methodName)
    );
};

decorateMethod(Post('start'), 'start');
decorateMethod(HttpCode(HttpStatus.CREATED), 'start');
decorateMethod(Post('next-question'), 'getNextQuestion');
decorateMethod(Post('submit-answer'), 'submitAnswer');
decorateMethod(Post('end'), 'endSession');
decorateMethod(Post('abandon'), 'abandonSession');
decorateMethod(Get(':id'), 'getSession');
decorateMethod(Get('user/history'), 'getUserHistory');

Reflect.defineMetadata('design:paramtypes', [SessionService], SessionController);

module.exports = { SessionController };
