/**
 * Dashboard Routes
 * 
 * Analytics and insights API for user dashboard:
 * - Summary statistics
 * - Domain breakdown
 * - Session history
 * - Improvement trends
 * - Skill radar data
 */

const express = require('express');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');
const { skillProfileService } = require('../services/skill-profile.service');
const { prisma } = require('../db/prisma');

const router = express.Router();

// ============= SUMMARY =============

/**
 * GET /api/dashboard/summary
 * Get overall dashboard summary for a user
 */
router.get('/summary', asyncHandler(async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    // Get skill summary
    const skillSummary = await skillProfileService.getUserSkillSummary(userId);

    // Get recent sessions count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await prisma.session.count({
        where: {
            userId,
            startTime: { gte: thirtyDaysAgo },
            status: 'completed',
        },
    });

    // Get total sessions
    const totalSessions = await prisma.session.count({
        where: { userId },
    });

    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEvents = await prisma.sessionEvent.count({
        where: {
            session: { userId },
            createdAt: { gte: today },
        },
    });

    // Get active streak (max streak from profiles)
    const maxStreak = await prisma.skillProfile.aggregate({
        where: { userId },
        _max: { streakDays: true },
    });

    // Get mistake patterns count
    const activePatterns = await prisma.mistakePattern.count({
        where: { userId, resolved: false },
    });

    res.json({
        success: true,
        data: {
            overview: {
                overallMastery: skillSummary.overallMastery,
                topicsLearned: skillSummary.topicsCount,
                totalQuestions: skillSummary.totalQuestions,
                correctAnswers: skillSummary.correctAnswers,
                accuracy: skillSummary.totalQuestions > 0
                    ? Math.round((skillSummary.correctAnswers / skillSummary.totalQuestions) * 100)
                    : 0,
            },
            sessions: {
                total: totalSessions,
                last30Days: recentSessions,
                todayQuestions: todayEvents,
            },
            streak: maxStreak._max.streakDays || 0,
            mistakePatterns: activePatterns,
            strengths: skillSummary.strengths,
            weaknesses: skillSummary.weaknesses,
        },
    });
}));

// ============= DOMAINS =============

/**
 * GET /api/dashboard/domains
 * Get domain-wise breakdown
 */
router.get('/domains', asyncHandler(async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    const breakdown = await skillProfileService.getDomainBreakdown(userId);

    // Also get session counts per domain
    const sessionCounts = await prisma.session.groupBy({
        by: ['domain'],
        where: { userId },
        _count: { id: true },
    });

    const sessionCountMap = {};
    sessionCounts.forEach(s => {
        sessionCountMap[s.domain] = s._count.id;
    });

    const enrichedBreakdown = breakdown.map(d => ({
        ...d,
        sessions: sessionCountMap[d.domain] || 0,
    }));

    res.json({
        success: true,
        data: enrichedBreakdown,
    });
}));

// ============= HISTORY =============

/**
 * GET /api/dashboard/history
 * Get session history
 */
router.get('/history', asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    const history = await skillProfileService.getSessionHistory(userId, limit + offset);
    const paginatedHistory = history.slice(offset, offset + limit);

    res.json({
        success: true,
        data: {
            sessions: paginatedHistory,
            total: history.length,
            hasMore: offset + limit < history.length,
        },
    });
}));

// ============= TRENDS =============

/**
 * GET /api/dashboard/trends
 * Get improvement trends over time
 */
router.get('/trends', asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    const days = parseInt(req.query.days) || 30;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    const trends = await skillProfileService.getImprovementTrends(userId, days);

    // Also get weekly averages for smoother chart
    const weeklyData = [];
    const weekMap = {};

    trends.forEach(d => {
        const date = new Date(d.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weekMap[weekKey]) {
            weekMap[weekKey] = {
                week: weekKey,
                totalScore: 0,
                count: 0,
                questions: 0,
            };
        }
        weekMap[weekKey].totalScore += d.avgScore * d.questionsAnswered;
        weekMap[weekKey].count += 1;
        weekMap[weekKey].questions += d.questionsAnswered;
    });

    Object.values(weekMap).forEach(w => {
        weeklyData.push({
            week: w.week,
            avgScore: Math.round((w.totalScore / w.questions) * 10) / 10,
            daysActive: w.count,
            questionsAnswered: w.questions,
        });
    });

    res.json({
        success: true,
        data: {
            daily: trends,
            weekly: weeklyData.sort((a, b) => a.week.localeCompare(b.week)),
        },
    });
}));

// ============= SKILL RADAR =============

/**
 * GET /api/dashboard/skills
 * Get skill data for radar chart
 */
router.get('/skills', asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    const domain = req.query.domain || null;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    const radarData = await skillProfileService.getSkillRadarData(userId, domain);

    // Get all profiles for detailed view
    const profiles = await prisma.skillProfile.findMany({
        where: { userId, ...(domain ? { domain } : {}) },
        orderBy: { lastSeen: 'desc' },
    });

    res.json({
        success: true,
        data: {
            radar: radarData,
            profiles: profiles.map(p => ({
                id: p.id,
                domain: p.domain,
                topic: p.topic,
                mastery: Math.round(p.masteryScore),
                questions: p.questionsSeen,
                accuracy: p.questionsSeen > 0
                    ? Math.round((p.correctAnswers / p.questionsSeen) * 100)
                    : 0,
                trend: p.trend,
                lastSeen: p.lastSeen,
            })),
        },
    });
}));

// ============= MISTAKE PATTERNS =============

/**
 * GET /api/dashboard/mistakes
 * Get user's mistake patterns
 */
router.get('/mistakes', asyncHandler(async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    const patterns = await skillProfileService.getMistakePatterns(userId);

    res.json({
        success: true,
        data: patterns.map(p => ({
            id: p.id,
            type: p.patternType,
            description: p.description,
            frequency: p.frequency,
            severity: p.severity,
            firstSeen: p.firstSeen,
            lastSeen: p.lastSeen,
        })),
    });
}));

/**
 * POST /api/dashboard/mistakes/:patternId/resolve
 * Mark a mistake pattern as resolved
 */
router.post('/mistakes/:patternId/resolve', asyncHandler(async (req, res) => {
    const { patternId } = req.params;
    const userId = req.body.userId || req.query.userId;

    if (!userId) {
        throw new ApiError('userId is required', 400);
    }

    await skillProfileService.resolveMistakePattern(userId, patternId);

    res.json({
        success: true,
        message: 'Pattern marked as resolved',
    });
}));

// ============= LEADERBOARD =============

/**
 * GET /api/dashboard/leaderboard
 * Get top performers (optional feature)
 */
router.get('/leaderboard', asyncHandler(async (req, res) => {
    const domain = req.query.domain || null;
    const limit = parseInt(req.query.limit) || 10;

    // Get top users by overall mastery
    const topProfiles = await prisma.skillProfile.groupBy({
        by: ['userId'],
        where: domain ? { domain } : {},
        _avg: { masteryScore: true },
        _sum: { questionsSeen: true },
        orderBy: { _avg: { masteryScore: 'desc' } },
        take: limit,
    });

    // Get user details
    const userIds = topProfiles.map(p => p.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
    });

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const leaderboard = topProfiles.map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        name: userMap[p.userId] || 'Anonymous',
        avgMastery: Math.round(p._avg.masteryScore),
        totalQuestions: p._sum.questionsSeen,
    }));

    res.json({
        success: true,
        data: leaderboard,
    });
}));

module.exports = router;
