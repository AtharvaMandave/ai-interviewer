/**
 * Skill Profile Service
 * 
 * Manages user skill tracking, mastery scores, and improvement trends:
 * - Update profile after each answer
 * - Track mistake patterns
 * - Calculate improvement trends
 * - Provide skill analytics
 */

const { prisma } = require('../db/prisma');

// Trend calculation windows
const TREND_WINDOW = 10; // Number of recent answers to consider
const IMPROVEMENT_THRESHOLD = 5; // Percentage change for trend detection

class SkillProfileService {

    // ============= SKILL PROFILE MANAGEMENT =============

    /**
     * Get or create a skill profile for a user/domain/topic
     */
    async getOrCreateProfile(userId, domain, topic) {
        let profile = await prisma.skillProfile.findUnique({
            where: {
                userId_domain_topic: { userId, domain, topic },
            },
        });

        if (!profile) {
            profile = await prisma.skillProfile.create({
                data: {
                    userId,
                    domain,
                    topic,
                    masteryScore: 50, // Start at 50%
                    questionsSeen: 0,
                    correctAnswers: 0,
                    avgScore: 0,
                    trend: 'stable',
                    streakDays: 0,
                },
            });
        }

        return profile;
    }

    /**
     * Update skill profile after answering a question
     * Formula: newMastery = oldMastery * 0.8 + (score/10) * 100 * 0.2
     */
    async updateAfterAnswer(userId, domain, topic, score, evaluation = {}) {
        const profile = await this.getOrCreateProfile(userId, domain, topic);

        const normalizedScore = Math.min(10, Math.max(0, score)); // Clamp to 0-10
        const scoreAsPercentage = (normalizedScore / 10) * 100;

        // Calculate new mastery (weighted average)
        const oldMastery = profile.masteryScore;
        const newMastery = oldMastery * 0.8 + scoreAsPercentage * 0.2;

        // Calculate new average score
        const totalScoreSum = profile.avgScore * profile.questionsSeen + normalizedScore * 10;
        const newQuestionsSeen = profile.questionsSeen + 1;
        const newAvgScore = totalScoreSum / newQuestionsSeen;

        // Update correct answers count (score >= 7 is "correct")
        const newCorrectAnswers = profile.correctAnswers + (normalizedScore >= 7 ? 1 : 0);

        // Calculate trend
        const trend = this.calculateTrend(oldMastery, newMastery, profile.trend);

        // Update streak (check if user answered yesterday)
        const streakDays = await this.updateStreak(userId, profile);

        // Update profile
        const updatedProfile = await prisma.skillProfile.update({
            where: { id: profile.id },
            data: {
                masteryScore: Math.round(newMastery * 100) / 100,
                questionsSeen: newQuestionsSeen,
                correctAnswers: newCorrectAnswers,
                avgScore: Math.round(newAvgScore * 100) / 100,
                lastSeen: new Date(),
                trend,
                streakDays,
            },
        });

        // Track mistake patterns if score is low
        if (normalizedScore < 5 && evaluation.triggeredRedFlags?.length > 0) {
            await this.trackMistakePattern(userId, evaluation);
        }

        return {
            profile: updatedProfile,
            change: {
                masteryChange: Math.round((newMastery - oldMastery) * 100) / 100,
                oldMastery: Math.round(oldMastery * 100) / 100,
                newMastery: Math.round(newMastery * 100) / 100,
                trend,
            },
        };
    }

    /**
     * Calculate trend based on mastery change
     */
    calculateTrend(oldMastery, newMastery, currentTrend) {
        const change = newMastery - oldMastery;
        const percentageChange = (change / oldMastery) * 100;

        if (percentageChange >= IMPROVEMENT_THRESHOLD) {
            return 'improving';
        } else if (percentageChange <= -IMPROVEMENT_THRESHOLD) {
            return 'declining';
        }
        return currentTrend; // Keep previous trend if change is small
    }

    /**
     * Update user's streak days
     */
    async updateStreak(userId, profile) {
        const lastSeen = new Date(profile.lastSeen);
        const today = new Date();

        // Reset time to compare dates only
        lastSeen.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today - lastSeen) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            // Same day - keep streak
            return profile.streakDays;
        } else if (daysDiff === 1) {
            // Next day - increment streak
            return profile.streakDays + 1;
        } else {
            // More than 1 day gap - reset streak
            return 1;
        }
    }

    // ============= SKILL ANALYTICS =============

    /**
     * Get full skill profile summary for a user
     */
    async getUserSkillSummary(userId) {
        const profiles = await prisma.skillProfile.findMany({
            where: { userId },
            orderBy: { masteryScore: 'desc' },
        });

        if (profiles.length === 0) {
            return {
                overallMastery: 0,
                topicsCount: 0,
                totalQuestions: 0,
                profiles: [],
                byDomain: {},
                strengths: [],
                weaknesses: [],
            };
        }

        // Calculate overall mastery (weighted by questions seen)
        const totalWeight = profiles.reduce((sum, p) => sum + p.questionsSeen, 0);
        const weightedMastery = totalWeight > 0
            ? profiles.reduce((sum, p) => sum + p.masteryScore * p.questionsSeen, 0) / totalWeight
            : 0;

        // Group by domain
        const byDomain = {};
        profiles.forEach(p => {
            if (!byDomain[p.domain]) {
                byDomain[p.domain] = {
                    topics: [],
                    avgMastery: 0,
                    totalQuestions: 0,
                };
            }
            byDomain[p.domain].topics.push(p);
            byDomain[p.domain].totalQuestions += p.questionsSeen;
        });

        // Calculate domain averages
        Object.keys(byDomain).forEach(domain => {
            const topics = byDomain[domain].topics;
            byDomain[domain].avgMastery = Math.round(
                topics.reduce((sum, t) => sum + t.masteryScore, 0) / topics.length
            );
        });

        // Identify strengths and weaknesses
        const sortedProfiles = [...profiles].sort((a, b) => b.masteryScore - a.masteryScore);
        const strengths = sortedProfiles
            .filter(p => p.masteryScore >= 70 && p.questionsSeen >= 3)
            .slice(0, 5)
            .map(p => ({ topic: p.topic, domain: p.domain, mastery: p.masteryScore }));

        const weaknesses = sortedProfiles
            .filter(p => p.masteryScore < 50 && p.questionsSeen >= 2)
            .reverse()
            .slice(0, 5)
            .map(p => ({ topic: p.topic, domain: p.domain, mastery: p.masteryScore }));

        return {
            overallMastery: Math.round(weightedMastery),
            topicsCount: profiles.length,
            totalQuestions: profiles.reduce((sum, p) => sum + p.questionsSeen, 0),
            correctAnswers: profiles.reduce((sum, p) => sum + p.correctAnswers, 0),
            profiles,
            byDomain,
            strengths,
            weaknesses,
        };
    }

    /**
     * Get skill data formatted for radar chart
     */
    async getSkillRadarData(userId, domain = null) {
        const where = { userId };
        if (domain) where.domain = domain;

        const profiles = await prisma.skillProfile.findMany({
            where,
            orderBy: { masteryScore: 'desc' },
            take: 8, // Limit for radar chart readability
        });

        return profiles.map(p => ({
            topic: p.topic,
            mastery: Math.round(p.masteryScore),
            fullMark: 100,
        }));
    }

    /**
     * Get improvement trends over time
     */
    async getImprovementTrends(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get session events for the user
        const sessions = await prisma.session.findMany({
            where: {
                userId,
                startTime: { gte: startDate },
                status: 'completed',
            },
            include: {
                events: {
                    select: {
                        score: true,
                        createdAt: true,
                        question: {
                            select: { domain: true, topic: true },
                        },
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });

        // Group by date
        const dailyData = {};
        sessions.forEach(session => {
            session.events.forEach(event => {
                const dateKey = event.createdAt.toISOString().split('T')[0];
                if (!dailyData[dateKey]) {
                    dailyData[dateKey] = {
                        date: dateKey,
                        totalScore: 0,
                        count: 0,
                        avgScore: 0,
                    };
                }
                dailyData[dateKey].totalScore += event.score / 10; // Normalize to 0-10
                dailyData[dateKey].count++;
            });
        });

        // Calculate averages
        const trendData = Object.values(dailyData).map(d => ({
            date: d.date,
            avgScore: Math.round((d.totalScore / d.count) * 10) / 10,
            questionsAnswered: d.count,
        }));

        return trendData;
    }

    // ============= MISTAKE PATTERN TRACKING =============

    /**
     * Track a mistake pattern from evaluation
     */
    async trackMistakePattern(userId, evaluation) {
        const patterns = this.extractPatterns(evaluation);

        for (const pattern of patterns) {
            const existing = await prisma.mistakePattern.findUnique({
                where: {
                    userId_patternType: { userId, patternType: pattern.type },
                },
            });

            if (existing) {
                // Update existing pattern
                await prisma.mistakePattern.update({
                    where: { id: existing.id },
                    data: {
                        frequency: existing.frequency + 1,
                        lastSeen: new Date(),
                        examples: [...existing.examples, pattern.questionId].slice(-10),
                        severity: this.calculateSeverity(existing.frequency + 1),
                    },
                });
            } else {
                // Create new pattern
                await prisma.mistakePattern.create({
                    data: {
                        userId,
                        patternType: pattern.type,
                        description: pattern.description,
                        examples: [pattern.questionId],
                        frequency: 1,
                        severity: 'low',
                    },
                });
            }
        }
    }

    /**
     * Extract mistake patterns from evaluation data
     */
    extractPatterns(evaluation) {
        const patterns = [];

        // Red flags -> patterns
        if (evaluation.triggeredRedFlags) {
            evaluation.triggeredRedFlags.forEach(flag => {
                patterns.push({
                    type: this.normalizePatternType(flag.redFlag || flag),
                    description: typeof flag === 'string' ? flag : flag.redFlag,
                    questionId: evaluation.question?.id || 'unknown',
                });
            });
        }

        // Missing must-have points
        if (evaluation.coverage?.mustHave?.missing > 0) {
            patterns.push({
                type: 'misses_core_concepts',
                description: 'Frequently misses core concepts in answers',
                questionId: evaluation.question?.id || 'unknown',
            });
        }

        return patterns;
    }

    /**
     * Normalize pattern type to a consistent key
     */
    normalizePatternType(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
            .slice(0, 50);
    }

    /**
     * Calculate severity based on frequency
     */
    calculateSeverity(frequency) {
        if (frequency >= 5) return 'high';
        if (frequency >= 3) return 'medium';
        return 'low';
    }

    /**
     * Get user's mistake patterns
     */
    async getMistakePatterns(userId) {
        return prisma.mistakePattern.findMany({
            where: { userId, resolved: false },
            orderBy: [
                { severity: 'desc' },
                { frequency: 'desc' },
            ],
        });
    }

    /**
     * Mark a mistake pattern as resolved
     */
    async resolveMistakePattern(userId, patternId) {
        return prisma.mistakePattern.update({
            where: { id: patternId },
            data: { resolved: true },
        });
    }

    // ============= DOMAIN ANALYTICS =============

    /**
     * Get domain-wise breakdown for a user
     */
    async getDomainBreakdown(userId) {
        const profiles = await prisma.skillProfile.findMany({
            where: { userId },
        });

        const domains = {};
        profiles.forEach(p => {
            if (!domains[p.domain]) {
                domains[p.domain] = {
                    domain: p.domain,
                    topics: 0,
                    totalQuestions: 0,
                    correctAnswers: 0,
                    avgMastery: 0,
                    masterySum: 0,
                };
            }
            domains[p.domain].topics++;
            domains[p.domain].totalQuestions += p.questionsSeen;
            domains[p.domain].correctAnswers += p.correctAnswers;
            domains[p.domain].masterySum += p.masteryScore;
        });

        // Calculate averages
        return Object.values(domains).map(d => ({
            ...d,
            avgMastery: Math.round(d.masterySum / d.topics),
            accuracy: d.totalQuestions > 0
                ? Math.round((d.correctAnswers / d.totalQuestions) * 100)
                : 0,
        }));
    }

    /**
     * Get session history for a user
     */
    async getSessionHistory(userId, limit = 20) {
        const sessions = await prisma.session.findMany({
            where: { userId },
            include: {
                events: {
                    select: {
                        score: true,
                        question: {
                            select: { domain: true, topic: true, difficulty: true },
                        },
                    },
                },
                report: {
                    select: {
                        overallScore: true,
                        strengths: true,
                        weaknesses: true,
                    },
                },
            },
            orderBy: { startTime: 'desc' },
            take: limit,
        });

        return sessions.map(s => ({
            id: s.id,
            domain: s.domain,
            mode: s.mode,
            difficulty: s.difficulty,
            status: s.status,
            questionsAnswered: s.events.length,
            avgScore: s.events.length > 0
                ? Math.round(s.events.reduce((sum, e) => sum + e.score, 0) / s.events.length) / 10
                : 0,
            totalScore: s.report?.overallScore || s.totalScore || 0,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.endTime
                ? Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000 / 60)
                : null,
        }));
    }
}

const skillProfileService = new SkillProfileService();

module.exports = { SkillProfileService, skillProfileService };
