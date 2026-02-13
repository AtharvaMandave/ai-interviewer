/**
 * Policy Routes - Manage interview policy rules
 * 
 * Endpoints for viewing and updating policy configuration.
 * Admin-only in production.
 */

const express = require('express');
const { prisma } = require('../db/prisma');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');
const { policyEngine, DEFAULT_RULES } = require('../services/policy-engine.service');

const router = express.Router();

// ============= GET CURRENT POLICY =============

/**
 * GET /api/policy
 * Get current active policy rules
 */
router.get('/', asyncHandler(async (req, res) => {
    // Try to load from DB first
    let dbPolicy = null;
    try {
        dbPolicy = await prisma.policyRule.findFirst({
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
        });
    } catch (error) {
        // Table might not exist yet
        console.warn('[Policy] Could not load from DB:', error.message);
    }

    const rules = dbPolicy
        ? { ...DEFAULT_RULES, ...dbPolicy.config }
        : policyEngine.getRules();

    res.json({
        success: true,
        data: {
            id: dbPolicy?.id || 'runtime',
            name: dbPolicy?.name || 'Runtime Policy',
            source: dbPolicy ? 'database' : 'runtime',
            rules,
            updatedAt: dbPolicy?.updatedAt || new Date().toISOString(),
        },
    });
}));

/**
 * GET /api/policy/defaults
 * Get default policy rules (read-only reference)
 */
router.get('/defaults', asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: DEFAULT_RULES,
    });
}));

// ============= UPDATE POLICY =============

/**
 * PUT /api/policy
 * Update policy rules (merges with defaults)
 * 
 * Body: { rules: { ... } }
 */
router.put('/', asyncHandler(async (req, res) => {
    const { rules, name, description } = req.body;

    if (!rules || typeof rules !== 'object') {
        throw new ApiError('Rules object is required', 400);
    }

    // Merge with defaults
    const mergedRules = {
        ...DEFAULT_RULES,
        ...rules,
    };

    // Deep merge nested objects
    for (const key of Object.keys(DEFAULT_RULES)) {
        if (typeof DEFAULT_RULES[key] === 'object' && !Array.isArray(DEFAULT_RULES[key])) {
            mergedRules[key] = {
                ...DEFAULT_RULES[key],
                ...(rules[key] || {}),
            };
        }
    }

    // Save to database
    let savedPolicy;
    try {
        savedPolicy = await prisma.policyRule.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                name: name || 'Custom Policy',
                description: description || 'User-configured policy rules',
                config: mergedRules,
                isActive: true,
            },
            update: {
                name: name || undefined,
                description: description || undefined,
                config: mergedRules,
                updatedAt: new Date(),
            },
        });
    } catch (error) {
        console.warn('[Policy] Could not save to DB, updating runtime only:', error.message);
        // Update runtime policy instead
        policyEngine.updateRules(rules);

        return res.json({
            success: true,
            data: {
                id: 'runtime',
                source: 'runtime',
                rules: policyEngine.getRules(),
                message: 'Updated runtime policy (DB unavailable)',
            },
        });
    }

    // Update runtime policy
    policyEngine.updateRules(mergedRules);

    res.json({
        success: true,
        data: {
            id: savedPolicy.id,
            name: savedPolicy.name,
            source: 'database',
            rules: mergedRules,
            updatedAt: savedPolicy.updatedAt,
        },
    });
}));

/**
 * PATCH /api/policy/:section
 * Update a specific section of policy rules
 * 
 * Sections: thresholds, followUp, difficulty, topicSwitch, sessionLimits, scoring, adaptive
 */
router.patch('/:section', asyncHandler(async (req, res) => {
    const { section } = req.params;
    const updates = req.body;

    const validSections = ['thresholds', 'followUp', 'difficulty', 'topicSwitch', 'sessionLimits', 'scoring', 'adaptive'];

    if (!validSections.includes(section)) {
        throw new ApiError(`Invalid section. Valid sections: ${validSections.join(', ')}`, 400);
    }

    // Get current rules
    const currentRules = policyEngine.getRules();

    // Update specific section
    const updatedRules = {
        ...currentRules,
        [section]: {
            ...currentRules[section],
            ...updates,
        },
    };

    // Try to save to DB
    try {
        await prisma.policyRule.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                name: 'Custom Policy',
                config: updatedRules,
                isActive: true,
            },
            update: {
                config: updatedRules,
                updatedAt: new Date(),
            },
        });
    } catch (error) {
        console.warn('[Policy] DB update failed:', error.message);
    }

    // Update runtime
    policyEngine.updateRules(updatedRules);

    res.json({
        success: true,
        data: {
            section,
            updated: updatedRules[section],
        },
    });
}));

// ============= POLICY SIMULATION =============

/**
 * POST /api/policy/simulate
 * Simulate policy decision for given session state
 * Useful for testing and debugging policy rules
 * 
 * Body: { sessionState: { currentScore, questionNumber, recentScores, ... } }
 */
router.post('/simulate', asyncHandler(async (req, res) => {
    const { sessionState } = req.body;

    if (!sessionState) {
        throw new ApiError('sessionState is required', 400);
    }

    const decision = policyEngine.decide(sessionState);
    const scoreClassification = sessionState.currentScore
        ? policyEngine.classifyScore(sessionState.currentScore)
        : null;

    res.json({
        success: true,
        data: {
            decision,
            scoreClassification,
            appliedRules: policyEngine.getRules(),
        },
    });
}));

/**
 * POST /api/policy/calculate-score
 * Calculate score using current policy weights
 * 
 * Body: { coverage, answerQuality, redFlagsCount }
 */
router.post('/calculate-score', asyncHandler(async (req, res) => {
    const { coverage, answerQuality, redFlagsCount = 0 } = req.body;

    if (!coverage || !answerQuality) {
        throw new ApiError('coverage and answerQuality are required', 400);
    }

    const score = policyEngine.calculateScore(coverage, answerQuality, redFlagsCount);
    const classification = policyEngine.classifyScore(score);

    res.json({
        success: true,
        data: {
            score,
            classification,
            weights: policyEngine.getRules().scoring,
        },
    });
}));

// ============= RESET POLICY =============

/**
 * DELETE /api/policy
 * Reset to default policy rules
 */
router.delete('/', asyncHandler(async (req, res) => {
    // Delete from DB
    try {
        await prisma.policyRule.deleteMany({});
    } catch (error) {
        console.warn('[Policy] Could not delete from DB:', error.message);
    }

    // Reset runtime
    policyEngine.updateRules(DEFAULT_RULES);

    res.json({
        success: true,
        message: 'Policy reset to defaults',
        data: DEFAULT_RULES,
    });
}));

module.exports = router;
