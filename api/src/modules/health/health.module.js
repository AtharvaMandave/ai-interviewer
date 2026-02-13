const { Module } = require('@nestjs/common');
const { HealthController } = require('./health.controller');
const { HealthService } = require('./health.service');

@Module({
    controllers: [HealthController],
    providers: [HealthService],
})
class HealthModule { }

module.exports = { HealthModule };
