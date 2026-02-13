const { Injectable } = require('@nestjs/common');
const { RedisService } = require('./redis.service');
const { VectorService } = require('./vector.service');

/**
 * Memory Service - Unified interface for session memory
 */
@Injectable()
class MemoryService {
    constructor(redisService, vectorService) {
        this.redis = redisService;
        this.vector = vectorService;
    }

    // Session memory
    async getSession(sessionId) {
        return this.redis.getSessionState(sessionId);
    }

    async setSession(sessionId, state) {
        return this.redis.setSessionState(sessionId, state);
    }

    // Long-term memory (vector search)
    async storeMistake(userId, mistake) {
        // Will implement in Phase 6
    }

    async recallMistakes(userId, context) {
        // Will implement in Phase 6
        return [];
    }

    async storeSuccess(userId, success) {
        // Will implement in Phase 6
    }
}

module.exports = { MemoryService };
