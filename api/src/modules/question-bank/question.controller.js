const {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    Inject,
} = require('@nestjs/common');
const { QuestionService } = require('./question.service');
const { ApiResponse } = require('../../common/types/api-response');

/**
 * Question Controller
 * Handles CRUD operations for interview questions
 */
class QuestionController {
    constructor(questionService) {
        this.questionService = questionService;
    }

    /**
     * Create a new question with optional rubric
     * POST /api/questions
     */
    async create(req, res) {
        const question = await this.questionService.createQuestion(req.body);
        return ApiResponse.success(question, 'Question created successfully');
    }

    /**
     * Get all questions with filters
     * GET /api/questions?domain=Java&difficulty=Medium
     */
    async findAll(req, res) {
        const { domain, difficulty, topic, limit, offset } = req.query;
        const questions = await this.questionService.getQuestions({
            domain,
            difficulty,
            topic,
            take: parseInt(limit) || 20,
            skip: parseInt(offset) || 0,
        });
        return ApiResponse.success(questions);
    }

    /**
     * Get question statistics by domain
     * GET /api/questions/stats
     */
    async getStats(req, res) {
        const stats = await this.questionService.getDomainStats();
        return ApiResponse.success(stats);
    }

    /**
     * Get topics for a domain
     * GET /api/questions/topics/:domain
     */
    async getTopics(req, res) {
        const { domain } = req.params;
        const topics = await this.questionService.getDomainTopics(domain);
        return ApiResponse.success({ domain, topics });
    }

    /**
     * Get random question based on criteria
     * GET /api/questions/random?domain=Java
     */
    async getRandom(req, res) {
        const { domain, difficulty, topic, excludeIds } = req.query;
        const excluded = excludeIds ? excludeIds.split(',') : [];
        const question = await this.questionService.getRandomQuestion({
            domain,
            difficulty,
            topic,
            excludeIds: excluded,
        });

        if (!question) {
            return ApiResponse.error('No questions found matching criteria', 404);
        }

        return ApiResponse.success(question);
    }

    /**
     * Get single question by ID
     * GET /api/questions/:id
     */
    async findOne(req, res) {
        const question = await this.questionService.getQuestionById(req.params.id);
        return ApiResponse.success(question);
    }

    /**
     * Update a question
     * PUT /api/questions/:id
     */
    async update(req, res) {
        const question = await this.questionService.updateQuestion(req.params.id, req.body);
        return ApiResponse.success(question, 'Question updated successfully');
    }

    /**
     * Delete a question (soft delete)
     * DELETE /api/questions/:id
     */
    async remove(req, res) {
        await this.questionService.deleteQuestion(req.params.id);
        return ApiResponse.success({ id: req.params.id }, 'Question deleted successfully');
    }

    /**
     * Bulk create questions
     * POST /api/questions/bulk
     */
    async bulkCreate(req, res) {
        const questions = req.body;
        const results = [];
        for (const question of questions) {
            try {
                const created = await this.questionService.createQuestion(question);
                results.push({ success: true, id: created.id });
            } catch (error) {
                results.push({ success: false, error: error.message, question: question.text?.substring(0, 50) });
            }
        }
        return ApiResponse.success({
            created: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });
    }
}

// Apply decorators manually
Reflect.decorate([Controller('questions')], QuestionController);

const decorateMethod = (decorator, methodName) => {
    Reflect.decorate(
        [decorator],
        QuestionController.prototype,
        methodName,
        Object.getOwnPropertyDescriptor(QuestionController.prototype, methodName)
    );
};

decorateMethod(Post(), 'create');
decorateMethod(HttpCode(HttpStatus.CREATED), 'create');
decorateMethod(Get(), 'findAll');
decorateMethod(Get('stats'), 'getStats');
decorateMethod(Get('topics/:domain'), 'getTopics');
decorateMethod(Get('random'), 'getRandom');
decorateMethod(Get(':id'), 'findOne');
decorateMethod(Put(':id'), 'update');
decorateMethod(Delete(':id'), 'remove');
decorateMethod(HttpCode(HttpStatus.OK), 'remove');
decorateMethod(Post('bulk'), 'bulkCreate');
decorateMethod(HttpCode(HttpStatus.CREATED), 'bulkCreate');

Reflect.defineMetadata('design:paramtypes', [QuestionService], QuestionController);

module.exports = { QuestionController };
