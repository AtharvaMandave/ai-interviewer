const { Module } = require('@nestjs/common');
const { ReportWorker } = require('./report.worker');
const { RoadmapWorker } = require('./roadmap.worker');
const { EmbeddingWorker } = require('./embedding.worker');
const { RubricWorker } = require('./rubric.worker');

@Module({
    providers: [ReportWorker, RoadmapWorker, EmbeddingWorker, RubricWorker],
    exports: [ReportWorker, RoadmapWorker, EmbeddingWorker, RubricWorker],
})
class WorkersModule { }

module.exports = { WorkersModule };
