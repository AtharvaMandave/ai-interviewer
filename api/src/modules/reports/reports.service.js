const { Injectable, NotFoundException } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');
const { ReportGenerator } = require('./report.generator');

/**
 * Reports Service - Manage session reports
 */
@Injectable()
class ReportsService {
    constructor(prismaService, reportGenerator) {
        this.prisma = prismaService;
        this.generator = reportGenerator;
    }

    async getReport(sessionId) {
        const report = await this.prisma.report.findUnique({
            where: { sessionId },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        return report;
    }

    async generateReport(sessionId) {
        // Get session with events
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                events: {
                    include: { question: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        // Generate report data
        const reportData = this.generator.generate(session);

        // Save report
        return this.prisma.report.upsert({
            where: { sessionId },
            update: reportData,
            create: { sessionId, ...reportData },
        });
    }

    async getUserReports(userId, limit = 10) {
        return this.prisma.report.findMany({
            where: { session: { userId } },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                session: {
                    select: {
                        domain: true,
                        mode: true,
                        startTime: true,
                    },
                },
            },
        });
    }

    async deleteReport(sessionId) {
        return this.prisma.report.delete({
            where: { sessionId },
        });
    }
}

module.exports = { ReportsService };
