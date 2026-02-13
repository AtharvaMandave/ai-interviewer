const express = require('express');
const { prisma } = require('../db/prisma');
const { asyncHandler, ApiError } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * POST /api/rubrics/:questionId
 * Create a rubric for a question
 */
router.post('/:questionId', asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { mustHave, goodToHave, redFlags, idealAnswer } = req.body;

    // Check if question exists
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) {
        throw new ApiError('Question not found', 404);
    }

    // Check if rubric already exists
    const existing = await prisma.rubric.findUnique({ where: { questionId } });
    if (existing) {
        throw new ApiError('Rubric already exists for this question', 400);
    }

    const rubric = await prisma.rubric.create({
        data: {
            questionId,
            mustHave: mustHave || [],
            goodToHave: goodToHave || [],
            redFlags: redFlags || [],
            idealAnswer,
            keywords: extractKeywords(mustHave, goodToHave),
        },
    });

    res.status(201).json({
        success: true,
        data: rubric,
        message: 'Rubric created successfully',
    });
}));

/**
 * GET /api/rubrics/:questionId
 * Get rubric by question ID
 */
router.get('/:questionId', asyncHandler(async (req, res) => {
    const rubric = await prisma.rubric.findUnique({
        where: { questionId: req.params.questionId },
        include: { question: true },
    });

    if (!rubric) {
        throw new ApiError('Rubric not found', 404);
    }

    res.json({
        success: true,
        data: rubric,
    });
}));

/**
 * PUT /api/rubrics/:questionId
 * Update a rubric
 */
router.put('/:questionId', asyncHandler(async (req, res) => {
    const { mustHave, goodToHave, redFlags, idealAnswer } = req.body;

    const rubric = await prisma.rubric.update({
        where: { questionId: req.params.questionId },
        data: {
            ...(mustHave && { mustHave }),
            ...(goodToHave && { goodToHave }),
            ...(redFlags && { redFlags }),
            ...(idealAnswer !== undefined && { idealAnswer }),
            keywords: extractKeywords(mustHave, goodToHave),
        },
    });

    res.json({
        success: true,
        data: rubric,
        message: 'Rubric updated successfully',
    });
}));

/**
 * PUT /api/rubrics/:questionId/upsert
 * Create or update a rubric
 */
router.put('/:questionId/upsert', asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const { mustHave, goodToHave, redFlags, idealAnswer } = req.body;

    const rubric = await prisma.rubric.upsert({
        where: { questionId },
        create: {
            questionId,
            mustHave: mustHave || [],
            goodToHave: goodToHave || [],
            redFlags: redFlags || [],
            idealAnswer,
            keywords: extractKeywords(mustHave, goodToHave),
        },
        update: {
            mustHave: mustHave || [],
            goodToHave: goodToHave || [],
            redFlags: redFlags || [],
            idealAnswer,
            keywords: extractKeywords(mustHave, goodToHave),
        },
    });

    res.json({
        success: true,
        data: rubric,
        message: 'Rubric saved successfully',
    });
}));

/**
 * DELETE /api/rubrics/:questionId
 * Delete a rubric
 */
router.delete('/:questionId', asyncHandler(async (req, res) => {
    await prisma.rubric.delete({
        where: { questionId: req.params.questionId },
    });

    res.json({
        success: true,
        data: { questionId: req.params.questionId },
        message: 'Rubric deleted successfully',
    });
}));

/**
 * GET /api/rubrics/:questionId/stats
 * Get rubric stats
 */
router.get('/:questionId/stats', asyncHandler(async (req, res) => {
    const rubric = await prisma.rubric.findUnique({
        where: { questionId: req.params.questionId },
    });

    if (!rubric) {
        throw new ApiError('Rubric not found', 404);
    }

    const maxScore = rubric.mustHave.length * 6 + rubric.goodToHave.length * 3;
    const minPenalty = rubric.redFlags.length * -1.5;

    res.json({
        success: true,
        data: {
            mustHaveCount: rubric.mustHave.length,
            goodToHaveCount: rubric.goodToHave.length,
            redFlagsCount: rubric.redFlags.length,
            maxScore,
            minPenalty,
            theoreticalMax: maxScore,
        },
    });
}));

/**
 * Helper function to extract keywords
 */
function extractKeywords(mustHave = [], goodToHave = []) {
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have'];
    const allItems = [...mustHave, ...goodToHave];
    const keywords = new Set();

    for (const item of allItems) {
        const words = item.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length > 3 && !stopWords.includes(word)) {
                keywords.add(word);
            }
        }
    }

    return Array.from(keywords).slice(0, 20);
}

module.exports = router;
