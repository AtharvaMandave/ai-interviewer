const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

/**
 * Analytics Service - Dashboard data and insights
 */
@Injectable()
class AnalyticsService {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    /**
     * Get user dashboard summary
     */
    async getDashboardSummary(userId) {
        const [sessions, avgScore, topDomains, recentSessions] = await Promise.all([
            this.prisma.session.count({ where: { userId } }),
            this.prisma.session.aggregate({
                where: { userId, status: 'completed' },
                _avg: { totalScore: true },
            }),
            this.getTopDomains(userId),
            this.getRecentSessions(userId, 5),
        ]);

        return {
            totalSessions: sessions,
            averageScore: Math.round((avgScore._avg.totalScore || 0) * 10) / 10,
            topDomains,
            recentSessions,
        };
    }

    /**
     * Get top domains by practice count
     */
    async getTopDomains(userId) {
        const domains = await this.prisma.session.groupBy({
            by: ['domain'],
            where: { userId },
            _count: true,
            _avg: { totalScore: true },
            orderBy: { _count: { domain: 'desc' } },
            take: 5,
        });

        return domains.map((d) => ({
            domain: d.domain,
            sessions: d._count,
            averageScore: Math.round((d._avg.totalScore || 0) * 10) / 10,
        }));
    }

    /**
     * Get recent sessions
     */
    async getRecentSessions(userId, limit = 5) {
        return this.prisma.session.findMany({
            where: { userId },
            orderBy: { startTime: 'desc' },
            take: limit,
            select: {
                id: true,
                domain: true,
                status: true,
                totalScore: true,
                questionsAsked: true,
                startTime: true,
            },
        });
    }

    /**
     * Get domain-wise statistics
     */
    async getDomainStats(userId) {
        const stats = await this.prisma.skillProfile.findMany({
            where: { userId },
            orderBy: [{ domain: 'asc' }, { masteryScore: 'desc' }],
        });

        // Group by domain
        const grouped = {};
        for (const profile of stats) {
            if (!grouped[profile.domain]) {
                grouped[profile.domain] = {
                    topics: [],
                    averageMastery: 0,
                };
            }
            grouped[profile.domain].topics.push({
                topic: profile.topic,
                mastery: profile.masteryScore,
                trend: profile.trend,
                lastSeen: profile.lastSeen,
            });
        }

        // Calculate averages
        for (const domain of Object.keys(grouped)) {
            const topics = grouped[domain].topics;
            const avg = topics.reduce((sum, t) => sum + t.mastery, 0) / topics.length;
            grouped[domain].averageMastery = Math.round(avg);
        }

        return grouped;
    }

    /**
     * Get improvement trends
     */
    async getTrends(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                status: 'completed',
                startTime: { gte: startDate },
            },
            orderBy: { startTime: 'asc' },
            select: {
                totalScore: true,
                startTime: true,
                domain: true,
            },
        });

        // Group by date
        const dailyScores = {};
        for (const session of sessions) {
            const date = session.startTime.toISOString().split('T')[0];
            if (!dailyScores[date]) {
                dailyScores[date] = { scores: [], count: 0 };
            }
            if (session.totalScore) {
                dailyScores[date].scores.push(session.totalScore);
                dailyScores[date].count++;
            }
        }

        return Object.entries(dailyScores).map(([date, data]) => ({
            date,
            averageScore: data.scores.length
                ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
                : null,
            sessions: data.count,
        }));
    }
}

module.exports = { AnalyticsService };
