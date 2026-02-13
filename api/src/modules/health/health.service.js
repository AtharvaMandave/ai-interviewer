const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

@Injectable()
class HealthService {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    async check() {
        const dbHealth = await this.prisma.healthCheck();

        return {
            status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth,
                api: { status: 'healthy' },
            },
        };
    }

    async readiness() {
        const dbHealth = await this.prisma.healthCheck();

        if (dbHealth.status !== 'healthy') {
            return {
                status: 'not_ready',
                reason: 'Database not available',
            };
        }

        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
        };
    }

    async liveness() {
        return {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
}

module.exports = { HealthService };
