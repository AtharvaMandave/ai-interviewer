const { Injectable } = require('@nestjs/common');

/**
 * Report Worker - Processes report generation jobs
 * Placeholder for Phase 7 BullMQ worker
 */
@Injectable()
class ReportWorker {
    async process(job) {
        const { sessionId } = job.data;
        console.log(`[ReportWorker] Processing report for session: ${sessionId}`);

        // Will implement with actual report generation in Phase 7
        // 1. Load session with events
        // 2. Generate report using ReportGenerator
        // 3. Save to database

        return { success: true, sessionId };
    }
}

module.exports = { ReportWorker };
