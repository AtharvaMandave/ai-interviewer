const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

/**
 * Skill Profile Service - Manages user skill tracking
 */
@Injectable()
class SkillProfileService {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    async getProfile(userId) {
        return this.prisma.skillProfile.findMany({
            where: { userId },
            orderBy: [{ domain: 'asc' }, { masteryScore: 'desc' }],
        });
    }

    async getWeakTopics(userId, threshold = 50) {
        return this.prisma.skillProfile.findMany({
            where: { userId, masteryScore: { lt: threshold } },
            orderBy: { masteryScore: 'asc' },
        });
    }

    async getStrongTopics(userId, threshold = 70) {
        return this.prisma.skillProfile.findMany({
            where: { userId, masteryScore: { gte: threshold } },
            orderBy: { masteryScore: 'desc' },
        });
    }

    async updateProfile(userId, domain, topic, score) {
        const profile = await this.prisma.skillProfile.findUnique({
            where: { userId_domain_topic: { userId, domain, topic } },
        });

        const newAvg = profile
            ? ((profile.avgScore * profile.questionsSeen) + score) / (profile.questionsSeen + 1)
            : score;

        const trend = !profile ? 'stable'
            : score > profile.avgScore + 1 ? 'improving'
                : score < profile.avgScore - 1 ? 'declining'
                    : 'stable';

        return this.prisma.skillProfile.upsert({
            where: { userId_domain_topic: { userId, domain, topic } },
            update: {
                questionsSeen: { increment: 1 },
                correctAnswers: score >= 6 ? { increment: 1 } : undefined,
                avgScore: newAvg,
                masteryScore: Math.min(100, newAvg * 10),
                lastSeen: new Date(),
                trend,
            },
            create: {
                userId,
                domain,
                topic,
                questionsSeen: 1,
                correctAnswers: score >= 6 ? 1 : 0,
                avgScore: score,
                masteryScore: score * 10,
                trend: 'stable',
            },
        });
    }

    async getRecommendedTopics(userId, domain, limit = 5) {
        // Get topics needing practice (low mastery or stale)
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - 7);

        const profiles = await this.prisma.skillProfile.findMany({
            where: {
                userId,
                domain,
                OR: [
                    { masteryScore: { lt: 50 } },
                    { lastSeen: { lt: staleDate } },
                ],
            },
            orderBy: { masteryScore: 'asc' },
            take: limit,
        });

        return profiles.map((p) => p.topic);
    }
}

module.exports = { SkillProfileService };
