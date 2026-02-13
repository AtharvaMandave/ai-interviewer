const { Controller, Get } = require('@nestjs/common');
const { HealthService } = require('./health.service');

/**
 * Health Controller
 * Provides health check endpoints
 */
class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }

    async check() {
        return this.healthService.check();
    }

    async readiness() {
        return this.healthService.readiness();
    }

    async liveness() {
        return this.healthService.liveness();
    }
}

// Apply decorators manually
Reflect.decorate([Controller('health')], HealthController);

const decorateMethod = (decorator, methodName) => {
    Reflect.decorate(
        [decorator],
        HealthController.prototype,
        methodName,
        Object.getOwnPropertyDescriptor(HealthController.prototype, methodName)
    );
};

decorateMethod(Get(), 'check');
decorateMethod(Get('ready'), 'readiness');
decorateMethod(Get('live'), 'liveness');

Reflect.defineMetadata('design:paramtypes', [HealthService], HealthController);

module.exports = { HealthController };
