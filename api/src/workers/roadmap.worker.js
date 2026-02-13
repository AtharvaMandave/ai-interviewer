const { Injectable } = require('@nestjs/common');

/**
 * Roadmap Worker - Processes roadmap generation jobs
 * Placeholder for Phase 7 BullMQ worker
 */
@Injectable()
class RoadmapWorker {
    async process(job) {
        const { userId } = job.data;
        console.log(`[RoadmapWorker] Processing roadmap for user: ${userId}`);

        // Will implement with actual roadmap generation in Phase 7
        // 1. Load user skill profile
        // 2. Load mistake patterns
        // 3. Generate personalized roadmap using LLM
        // 4. Save to database

        return { success: true, userId };
    }
}

module.exports = { RoadmapWorker };
