const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

/**
 * Mistake Pattern Service - Tracks common mistakes
 */
@Injectable()
class MistakePatternService {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    async getPatterns(userId) {
        return this.prisma.mistakePattern.findMany({
            where: { userId, resolved: false },
            orderBy: [{ severity: 'desc' }, { frequency: 'desc' }],
        });
    }

    async recordPattern(userId, patternType, description, questionId, severity = 'medium') {
        return this.prisma.mistakePattern.upsert({
            where: { userId_patternType: { userId, patternType } },
            update: {
                frequency: { increment: 1 },
                examples: { push: questionId },
                lastSeen: new Date(),
                severity: severity === 'high' ? 'high' : undefined,
            },
            create: {
                userId,
                patternType,
                description,
                examples: [questionId],
                frequency: 1,
                severity,
            },
        });
    }

    async resolvePattern(userId, patternType) {
        return this.prisma.mistakePattern.update({
            where: { userId_patternType: { userId, patternType } },
            data: { resolved: true },
        });
    }

    async detectPatterns(evaluation, questionTopic) {
        const patterns = [];

        // Edge case detection
        if (evaluation.missing.some((m) =>
            m.toLowerCase().includes('edge') ||
            m.toLowerCase().includes('boundary')
        )) {
            patterns.push({
                type: 'misses_edge_cases',
                description: 'Frequently misses edge cases',
                severity: 'medium',
            });
        }

        // Time complexity gaps
        if (evaluation.missing.some((m) =>
            m.toLowerCase().includes('complexity') ||
            m.toLowerCase().includes('time') ||
            m.toLowerCase().includes('space')
        )) {
            patterns.push({
                type: 'weak_complexity_analysis',
                description: 'Struggles with complexity analysis',
                severity: 'high',
            });
        }

        // Wrong claims
        if (evaluation.wrongClaims.length > 0) {
            patterns.push({
                type: `misconception_${questionTopic.split('.')[0]}`,
                description: `Has misconceptions about ${questionTopic}`,
                severity: 'high',
            });
        }

        return patterns;
    }
}

module.exports = { MistakePatternService };
