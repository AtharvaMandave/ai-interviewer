const { Injectable, NotFoundException, BadRequestException } = require('@nestjs/common');
const { RubricRepository } = require('./rubric.repository');
const { RubricValidator } = require('./rubric.validator');

/**
 * Rubric Service - Manages rubrics for questions
 * Supports prebuilt rubrics and LLM-generated rubrics (hybrid approach)
 */
@Injectable()
class RubricService {
    constructor(rubricRepository, rubricValidator) {
        this.repository = rubricRepository;
        this.validator = rubricValidator;
    }

    /**
     * Get rubric for a question
     * Uses hybrid approach: check DB first, generate if missing
     */
    async getRubric(questionId) {
        // Method A: Check DB for existing rubric
        const existing = await this.repository.findByQuestionId(questionId);
        if (existing) {
            return existing;
        }

        // Method B: Would generate via LLM (implemented in Phase 3)
        // For now, return null if not found
        return null;
    }

    /**
     * Create a new rubric
     */
    async createRubric(questionId, rubricData) {
        // Validate rubric structure
        const validation = this.validator.validate(rubricData);
        if (!validation.valid) {
            throw new BadRequestException(validation.errors.join(', '));
        }

        // Sanitize and add keywords
        const sanitized = this.validator.sanitize(rubricData);

        return this.repository.create({
            questionId,
            ...sanitized,
        });
    }

    /**
     * Update an existing rubric
     */
    async updateRubric(questionId, rubricData) {
        const existing = await this.repository.findByQuestionId(questionId);
        if (!existing) {
            throw new NotFoundException('Rubric not found');
        }

        const validation = this.validator.validate(rubricData);
        if (!validation.valid) {
            throw new BadRequestException(validation.errors.join(', '));
        }

        const sanitized = this.validator.sanitize(rubricData);

        return this.repository.update(questionId, sanitized);
    }

    /**
     * Upsert rubric (create or update)
     */
    async upsertRubric(questionId, rubricData) {
        const validation = this.validator.validate(rubricData);
        if (!validation.valid) {
            throw new BadRequestException(validation.errors.join(', '));
        }

        const sanitized = this.validator.sanitize(rubricData);

        return this.repository.upsert(questionId, sanitized);
    }

    /**
     * Delete a rubric
     */
    async deleteRubric(questionId) {
        return this.repository.delete(questionId);
    }

    /**
     * Check if rubric exists
     */
    async hasRubric(questionId) {
        const rubric = await this.repository.findByQuestionId(questionId);
        return rubric !== null;
    }

    /**
     * Get rubric statistics
     */
    async getStats(rubric) {
        return {
            mustHaveCount: rubric.mustHave?.length || 0,
            goodToHaveCount: rubric.goodToHave?.length || 0,
            redFlagsCount: rubric.redFlags?.length || 0,
            hasIdealAnswer: !!rubric.idealAnswer,
            keywordsCount: rubric.keywords?.length || 0,
        };
    }
}

module.exports = { RubricService };
