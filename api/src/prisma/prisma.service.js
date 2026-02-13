const { Injectable, OnModuleInit, OnModuleDestroy } = require('@nestjs/common');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

/**
 * Prisma Service
 * Database connection and operations
 */
class PrismaService {
    constructor() {
        // Prisma 7 requires adapter for database connection
        this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(this.pool);

        this.prisma = new PrismaClient({ adapter });

        // Expose PrismaClient methods
        this.user = this.prisma.user;
        this.session = this.prisma.session;
        this.question = this.prisma.question;
        this.rubric = this.prisma.rubric;
        this.answer = this.prisma.answer;
        this.skillProfile = this.prisma.skillProfile;
        this.mistakePattern = this.prisma.mistakePattern;
        this.learningRoadmap = this.prisma.learningRoadmap;
        this.vectorDocument = this.prisma.vectorDocument;
        this.$queryRaw = this.prisma.$queryRaw.bind(this.prisma);
        this.$executeRaw = this.prisma.$executeRaw.bind(this.prisma);
        this.$executeRawUnsafe = this.prisma.$executeRawUnsafe.bind(this.prisma);
        this.$transaction = this.prisma.$transaction.bind(this.prisma);
    }

    async onModuleInit() {
        await this.prisma.$connect();
        console.log('✅ Database connected');
    }

    async onModuleDestroy() {
        await this.prisma.$disconnect();
        await this.pool.end();
        console.log('❌ Database disconnected');
    }

    /**
     * Health check for database connection
     */
    async healthCheck() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'healthy', message: 'Database connection is active' };
        } catch (error) {
            return { status: 'unhealthy', message: error.message };
        }
    }

    /**
     * Clean database (for testing only)
     */
    async cleanDatabase() {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('cleanDatabase can only be called in test environment');
        }

        const tablenames = await this.prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

        for (const { tablename } of tablenames) {
            if (tablename !== '_prisma_migrations') {
                await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
            }
        }
    }
}

// Apply decorator manually
Reflect.decorate([Injectable()], PrismaService);

module.exports = { PrismaService };
