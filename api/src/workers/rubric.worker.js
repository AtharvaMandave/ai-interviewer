const { Injectable } = require('@nestjs/common');

/**
 * Rubric Worker - Processes rubric generation jobs
 * Placeholder for Phase 7 BullMQ worker
 */
@Injectable()
class RubricWorker {
    async process(job) {
        const { questionId, questionText, domain } = job.data;
        console.log(`[RubricWorker] Processing rubric for question: ${questionId}`);

        // Will implement in Phase 7
        // 1. Generate rubric using LLM service
        // 2. Validate rubric structure
        // 3. Save to database
        // 4. Generate embeddings for rubric points

        return { success: true, questionId };
    }
}

module.exports = { RubricWorker };
