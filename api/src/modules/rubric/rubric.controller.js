const {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
} = require('@nestjs/common');
const { RubricService } = require('./rubric.service');
const { ApiResponse } = require('../../common/types/api-response');

/**
 * Rubric Controller
 * Handles CRUD operations for question rubrics
 */
class RubricController {
    constructor(rubricService) {
        this.rubricService = rubricService;
    }

    /**
     * Create a rubric for a question
     * POST /api/rubrics/:questionId
     */
    async create(req, res) {
        const rubric = await this.rubricService.createRubric(req.params.questionId, req.body);
        return ApiResponse.success(rubric, 'Rubric created successfully');
    }

    /**
     * Get rubric by question ID
     * GET /api/rubrics/:questionId
     */
    async findOne(req, res) {
        const rubric = await this.rubricService.getRubric(req.params.questionId);
        if (!rubric) {
            return ApiResponse.error('Rubric not found', 404);
        }
        return ApiResponse.success(rubric);
    }

    /**
     * Update a rubric
     * PUT /api/rubrics/:questionId
     */
    async update(req, res) {
        const rubric = await this.rubricService.updateRubric(req.params.questionId, req.body);
        return ApiResponse.success(rubric, 'Rubric updated successfully');
    }

    /**
     * Upsert a rubric (create or update)
     * PUT /api/rubrics/:questionId/upsert
     */
    async upsert(req, res) {
        const rubric = await this.rubricService.upsertRubric(req.params.questionId, req.body);
        return ApiResponse.success(rubric, 'Rubric saved successfully');
    }

    /**
     * Delete a rubric
     * DELETE /api/rubrics/:questionId
     */
    async remove(req, res) {
        await this.rubricService.deleteRubric(req.params.questionId);
        return ApiResponse.success({ questionId: req.params.questionId }, 'Rubric deleted successfully');
    }

    /**
     * Get rubric stats
     * GET /api/rubrics/:questionId/stats
     */
    async getStats(req, res) {
        const rubric = await this.rubricService.getRubric(req.params.questionId);
        if (!rubric) {
            return ApiResponse.error('Rubric not found', 404);
        }
        const stats = await this.rubricService.getStats(rubric);
        return ApiResponse.success(stats);
    }
}

// Apply decorators manually
Reflect.decorate([Controller('rubrics')], RubricController);

const decorateMethod = (decorator, methodName) => {
    Reflect.decorate(
        [decorator],
        RubricController.prototype,
        methodName,
        Object.getOwnPropertyDescriptor(RubricController.prototype, methodName)
    );
};

decorateMethod(Post(':questionId'), 'create');
decorateMethod(HttpCode(HttpStatus.CREATED), 'create');
decorateMethod(Get(':questionId'), 'findOne');
decorateMethod(Put(':questionId'), 'update');
decorateMethod(Put(':questionId/upsert'), 'upsert');
decorateMethod(Delete(':questionId'), 'remove');
decorateMethod(HttpCode(HttpStatus.OK), 'remove');
decorateMethod(Get(':questionId/stats'), 'getStats');

Reflect.defineMetadata('design:paramtypes', [RubricService], RubricController);

module.exports = { RubricController };
