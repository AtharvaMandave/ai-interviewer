const { Module } = require('@nestjs/common');
const { QueueService } = require('./queue.service');

@Module({
    providers: [QueueService],
    exports: [QueueService],
})
class QueueModule { }

module.exports = { QueueModule };
