const express = require('express');
const { prisma } = require('../db/prisma');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', async (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

/**
 * GET /api/health/ready
 * Readiness check (includes DB)
 */
router.get('/ready', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            success: true,
            data: {
                status: 'ready',
                database: 'connected',
            },
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            error: {
                status: 'not ready',
                database: 'disconnected',
                message: error.message,
            },
        });
    }
});

/**
 * GET /api/health/live
 * Liveness check
 */
router.get('/live', (req, res) => {
    res.json({
        success: true,
        data: { status: 'alive' },
    });
});

module.exports = router;
