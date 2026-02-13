const express = require('express');
const { prisma } = require('../db/prisma');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * POST /api/questions
 * Create a new question
 */
router.post('/', asyncHandler(async (req, res) => {
    const { domain, topic, subTopic, difficulty, text, tags, hints, companyTags, rubric } = req.body;

    const question = await prisma.question.create({
        data: {
            domain,
            topic,
            subTopic,
            difficulty: difficulty || 'Medium',
            text,
            tags: tags || [],
            hints: hints || [],
            companyTags: companyTags || [],
            rubric: rubric ? {
                create: {
                    mustHave: rubric.mustHave || [],
                    goodToHave: rubric.goodToHave || [],
                    redFlags: rubric.redFlags || [],
                    keywords: [],
                },
            } : undefined,
        },
        include: { rubric: true },
    });

    res.status(201).json({
        success: true,
        data: question,
        message: 'Question created successfully',
    });
}));

/**
 * GET /api/questions
 * List questions with filters
 */
router.get('/', asyncHandler(async (req, res) => {
    const { domain, difficulty, topic, limit = '20', offset = '0' } = req.query;

    const where = { isActive: true };
    if (domain) where.domain = domain;
    if (difficulty) where.difficulty = difficulty;
    if (topic) where.topic = { contains: topic, mode: 'insensitive' };

    const questions = await prisma.question.findMany({
        where,
        include: { rubric: true },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
    });

    res.json({
        success: true,
        data: questions,
        meta: {
            count: questions.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
        },
    });
}));

/**
 * GET /api/questions/stats
 * Get question statistics by domain
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await prisma.question.groupBy({
        by: ['domain'],
        _count: true,
        where: { isActive: true },
    });

    const data = stats.reduce((acc, item) => {
        acc[item.domain] = item._count;
        return acc;
    }, {});

    res.json({
        success: true,
        data,
    });
}));

/**
 * GET /api/questions/topics/:domain
 * Get topics for a domain
 */
router.get('/topics/:domain', asyncHandler(async (req, res) => {
    const { domain } = req.params;

    const topics = await prisma.question.findMany({
        where: { domain, isActive: true },
        select: { topic: true },
        distinct: ['topic'],
    });

    res.json({
        success: true,
        data: {
            domain,
            topics: topics.map(t => t.topic),
        },
    });
}));

/**
 * GET /api/questions/random
 * Get a random question
 */
router.get('/random', asyncHandler(async (req, res) => {
    const { domain, difficulty, topic, excludeIds } = req.query;

    const where = { isActive: true };
    if (domain) where.domain = domain;
    if (difficulty) where.difficulty = difficulty;
    if (topic) where.topic = topic;
    if (excludeIds) {
        where.id = { notIn: excludeIds.split(',') };
    }

    const count = await prisma.question.count({ where });
    if (count === 0) {
        return res.json({ success: true, data: null });
    }

    const skip = Math.floor(Math.random() * count);
    const question = await prisma.question.findFirst({
        where,
        include: { rubric: true },
        skip,
    });

    res.json({
        success: true,
        data: question,
    });
}));

/**
 * GET /api/questions/:id
 * Get single question
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const question = await prisma.question.findUnique({
        where: { id: req.params.id },
        include: { rubric: true },
    });

    if (!question) {
        throw new ApiError('Question not found', 404);
    }

    res.json({
        success: true,
        data: question,
    });
}));

/**
 * PUT /api/questions/:id
 * Update a question
 */
router.put('/:id', asyncHandler(async (req, res) => {
    const { domain, topic, subTopic, difficulty, text, tags, hints, companyTags } = req.body;

    const question = await prisma.question.update({
        where: { id: req.params.id },
        data: {
            ...(domain && { domain }),
            ...(topic && { topic }),
            ...(subTopic !== undefined && { subTopic }),
            ...(difficulty && { difficulty }),
            ...(text && { text }),
            ...(tags && { tags }),
            ...(hints && { hints }),
            ...(companyTags && { companyTags }),
        },
        include: { rubric: true },
    });

    res.json({
        success: true,
        data: question,
        message: 'Question updated successfully',
    });
}));

/**
 * DELETE /api/questions/:id
 * Soft delete a question
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    await prisma.question.update({
        where: { id: req.params.id },
        data: { isActive: false },
    });

    res.json({
        success: true,
        data: { id: req.params.id },
        message: 'Question deleted successfully',
    });
}));

/**
 * POST /api/questions/bulk
 * Bulk create questions
 */
router.post('/bulk', asyncHandler(async (req, res) => {
    const questions = req.body;
    const results = [];

    for (const q of questions) {
        try {
            const created = await prisma.question.create({
                data: {
                    domain: q.domain,
                    topic: q.topic,
                    subTopic: q.subTopic,
                    difficulty: q.difficulty || 'Medium',
                    text: q.text,
                    tags: q.tags || [],
                    hints: q.hints || [],
                    companyTags: q.companyTags || [],
                    rubric: q.rubric ? {
                        create: {
                            mustHave: q.rubric.mustHave || [],
                            goodToHave: q.rubric.goodToHave || [],
                            redFlags: q.rubric.redFlags || [],
                            keywords: [],
                        },
                    } : undefined,
                },
            });
            results.push({ success: true, id: created.id });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }

    res.status(201).json({
        success: true,
        data: {
            created: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        },
    });
}));

module.exports = router;
