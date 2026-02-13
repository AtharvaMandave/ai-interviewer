const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

/**
 * Analyst Agent - Tracks patterns, updates skill profile, generates roadmaps
 */
@Injectable()
class AnalystService {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    /**
     * Track answer and update skill profile
     */
    async trackAnswer(userId, evaluation, question) {
        const { domain, topic } = question;
        const { score } = evaluation;

        // Update or create skill profile
        await this.prisma.skillProfile.upsert({
            where: {
                userId_domain_topic: { userId, domain, topic },
            },
            update: {
                questionsSeen: { increment: 1 },
                correctAnswers: score >= 6 ? { increment: 1 } : undefined,
                avgScore: {
                    // Running average
                    set: await this.calculateNewAverage(userId, domain, topic, score),
                },
                lastSeen: new Date(),
                trend: await this.calculateTrend(userId, domain, topic, score),
            },
            create: {
                userId,
                domain,
                topic,
                masteryScore: score * 10,
                questionsSeen: 1,
                correctAnswers: score >= 6 ? 1 : 0,
                avgScore: score,
                trend: 'stable',
            },
        });

        // Detect mistake patterns
        await this.detectMistakePatterns(userId, evaluation, question);
    }

    /**
     * Calculate new running average
     */
    async calculateNewAverage(userId, domain, topic, newScore) {
        const profile = await this.prisma.skillProfile.findUnique({
            where: { userId_domain_topic: { userId, domain, topic } },
        });

        if (!profile) return newScore;

        const totalQuestions = profile.questionsSeen + 1;
        const newAvg = ((profile.avgScore * profile.questionsSeen) + newScore) / totalQuestions;
        return Math.round(newAvg * 10) / 10;
    }

    /**
     * Calculate skill trend
     */
    async calculateTrend(userId, domain, topic, newScore) {
        const profile = await this.prisma.skillProfile.findUnique({
            where: { userId_domain_topic: { userId, domain, topic } },
        });

        if (!profile || profile.questionsSeen < 3) return 'stable';

        if (newScore > profile.avgScore + 1) return 'improving';
        if (newScore < profile.avgScore - 1) return 'declining';
        return 'stable';
    }

    /**
     * Detect and record mistake patterns
     */
    async detectMistakePatterns(userId, evaluation, question) {
        const patterns = [];

        // Pattern: Missing edge cases
        if (evaluation.missing.some((m) => m.toLowerCase().includes('edge'))) {
            patterns.push({
                type: 'misses_edge_cases',
                description: 'Frequently misses edge cases in answers',
            });
        }

        // Pattern: Weak on complexity
        if (evaluation.missing.some((m) =>
            m.toLowerCase().includes('complexity') ||
            m.toLowerCase().includes('time')
        )) {
            patterns.push({
                type: 'weak_time_complexity',
                description: 'Struggles with time/space complexity analysis',
            });
        }

        // Pattern: Conceptual gaps
        if (evaluation.missing.length > 2) {
            patterns.push({
                type: `conceptual_gap_${question.topic.replace('.', '_')}`,
                description: `Conceptual gaps in ${question.topic}`,
            });
        }

        // Record patterns
        for (const pattern of patterns) {
            await this.prisma.mistakePattern.upsert({
                where: {
                    userId_patternType: { userId, patternType: pattern.type },
                },
                update: {
                    frequency: { increment: 1 },
                    examples: { push: question.id },
                    lastSeen: new Date(),
                },
                create: {
                    userId,
                    patternType: pattern.type,
                    description: pattern.description,
                    examples: [question.id],
                    frequency: 1,
                    severity: evaluation.score < 4 ? 'high' : 'medium',
                },
            });
        }
    }

    /**
     * Generate session report
     */
    async generateSessionReport(sessionId, events) {
        const topicScores = {};
        const strengths = [];
        const weaknesses = [];

        for (const event of events) {
            const topic = event.question?.topic || 'unknown';
            if (!topicScores[topic]) {
                topicScores[topic] = { scores: [], total: 0 };
            }
            topicScores[topic].scores.push(event.score);
            topicScores[topic].total++;
        }

        // Calculate averages and identify strengths/weaknesses
        const topicBreakdown = {};
        for (const [topic, data] of Object.entries(topicScores)) {
            const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
            topicBreakdown[topic] = {
                average: Math.round(avg * 10) / 10,
                questions: data.total,
            };

            if (avg >= 7) {
                strengths.push(topic);
            } else if (avg < 5) {
                weaknesses.push(topic);
            }
        }

        const overallScore = events.length > 0
            ? events.reduce((sum, e) => sum + e.score, 0) / events.length
            : 0;

        const report = await this.prisma.report.create({
            data: {
                sessionId,
                overallScore: Math.round(overallScore * 10) / 10,
                topicBreakdown,
                strengths,
                weaknesses,
                recommendations: this.generateRecommendations(weaknesses),
            },
        });

        return report;
    }

    /**
     * Generate study recommendations
     */
    generateRecommendations(weaknesses) {
        const recommendations = [];

        for (const topic of weaknesses) {
            recommendations.push(`Review fundamentals of ${topic}`);
            recommendations.push(`Practice more problems related to ${topic}`);
        }

        if (recommendations.length === 0) {
            recommendations.push('Continue practicing to maintain your skills');
        }

        return recommendations;
    }

    /**
     * Generate personalized roadmap
     */
    async generateRoadmap(userId) {
        const skillProfiles = await this.prisma.skillProfile.findMany({
            where: { userId },
            orderBy: { masteryScore: 'asc' },
        });

        const mistakes = await this.prisma.mistakePattern.findMany({
            where: { userId, resolved: false },
            orderBy: { frequency: 'desc' },
        });

        // Identify focus areas
        const weakTopics = skillProfiles
            .filter((s) => s.masteryScore < 50)
            .slice(0, 5)
            .map((s) => s.topic);

        const weeklyPlan = {
            week1: {
                focus: weakTopics.slice(0, 2),
                goals: ['Review fundamentals', 'Practice 5 questions per topic'],
            },
            week2: {
                focus: weakTopics.slice(2, 4),
                goals: ['Deep dive into concepts', 'Attempt medium difficulty questions'],
            },
            week3: {
                focus: mistakes.slice(0, 2).map((m) => m.patternType),
                goals: ['Address common mistake patterns', 'Practice edge cases'],
            },
            week4: {
                focus: ['revision', 'mock_interview'],
                goals: ['Full mock interview', 'Review all weak areas'],
            },
        };

        const roadmap = await this.prisma.roadmap.create({
            data: {
                userId,
                title: 'Personalized Study Plan',
                description: `Focus on ${weakTopics.length} weak areas`,
                weeklyPlan,
                focusTopics: weakTopics,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        });

        return roadmap;
    }
}

module.exports = { AnalystService };
