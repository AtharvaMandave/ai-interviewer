const { Injectable, NotFoundException } = require('@nestjs/common');
const { QuestionRepository } = require('./question.repository');

@Injectable()
class QuestionService {
    constructor(questionRepository) {
        this.repository = questionRepository;
    }

    /**
     * Create a new question with optional rubric
     */
    async createQuestion(createDto) {
        const { rubric, ...questionData } = createDto;

        const question = await this.repository.create({
            ...questionData,
            rubric: rubric ? { create: rubric } : undefined,
        });

        return question;
    }

    /**
     * Get all questions with filters
     */
    async getQuestions(filters = {}) {
        return this.repository.findMany(filters);
    }

    /**
     * Get a single question by ID
     */
    async getQuestionById(id) {
        const question = await this.repository.findById(id);
        if (!question) {
            throw new NotFoundException('Question not found');
        }
        return question;
    }

    /**
     * Get random question based on criteria
     */
    async getRandomQuestion(criteria = {}) {
        return this.repository.findRandom(criteria);
    }

    /**
     * Get questions by topic
     */
    async getQuestionsByTopic(domain, topic, difficulty = null) {
        return this.repository.findByTopic(domain, topic, difficulty);
    }

    /**
     * Update a question
     */
    async updateQuestion(id, updateDto) {
        const { rubric, ...questionData } = updateDto;

        // First check if question exists
        await this.getQuestionById(id);

        return this.repository.update(id, {
            ...questionData,
            ...(rubric && {
                rubric: {
                    upsert: {
                        create: rubric,
                        update: rubric,
                    },
                },
            }),
        });
    }

    /**
     * Soft delete a question
     */
    async deleteQuestion(id) {
        await this.getQuestionById(id);
        return this.repository.softDelete(id);
    }

    /**
     * Get domain statistics
     */
    async getDomainStats() {
        return this.repository.getStats();
    }

    /**
     * Get all topics for a domain
     */
    async getDomainTopics(domain) {
        return this.repository.getTopics(domain);
    }

    /**
     * Select next question based on session state
     */
    async selectNextQuestion(sessionState) {
        const { domain, difficulty, askedQuestionIds, currentTopic, weakTopics } = sessionState;

        // Priority 1: Weak topics
        if (weakTopics && weakTopics.length > 0) {
            for (const topic of weakTopics) {
                const question = await this.getRandomQuestion({
                    domain,
                    topic,
                    difficulty,
                    excludeIds: askedQuestionIds,
                });
                if (question) return question;
            }
        }

        // Priority 2: Current topic (for follow-ups)
        if (currentTopic) {
            const question = await this.getRandomQuestion({
                domain,
                topic: currentTopic,
                difficulty,
                excludeIds: askedQuestionIds,
            });
            if (question) return question;
        }

        // Priority 3: Any question in domain
        return this.getRandomQuestion({
            domain,
            difficulty,
            excludeIds: askedQuestionIds,
        });
    }
}

module.exports = { QuestionService };
