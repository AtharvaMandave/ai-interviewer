const { Injectable } = require('@nestjs/common');
const { QuestionService } = require('../question-bank/question.service');

/**
 * Interviewer Agent - Responsible for question selection and follow-ups
 */
@Injectable()
class InterviewerService {
    constructor(questionService) {
        this.questionService = questionService;
    }

    /**
     * Select next question based on session state
     */
    async selectQuestion(sessionState) {
        const { domain, difficulty, askedQuestionIds, weakTopics, currentTopic } = sessionState;

        // Use question service's smart selection
        return this.questionService.selectNextQuestion({
            domain,
            difficulty,
            askedQuestionIds: askedQuestionIds || [],
            currentTopic,
            weakTopics,
        });
    }

    /**
     * Generate a follow-up question based on evaluation
     * For now, returns a related question; will use LLM in Phase 3
     */
    async generateFollowUp(originalQuestion, evaluation, focusPoints) {
        // Try to find a related question in the same topic
        const relatedQuestion = await this.questionService.getRandomQuestion({
            domain: originalQuestion.domain,
            topic: originalQuestion.topic,
            excludeIds: [originalQuestion.id],
        });

        if (relatedQuestion) {
            return {
                ...relatedQuestion,
                isFollowUp: true,
                followUpContext: {
                    originalQuestionId: originalQuestion.id,
                    focusPoints,
                    reason: 'Clarification needed',
                },
            };
        }

        // If no related question, return null (will trigger topic switch)
        return null;
    }

    /**
     * Determine topic priority based on skill profile
     */
    async prioritizeTopics(userId, domain, skillProfile) {
        // Find topics with low mastery
        const weakTopics = skillProfile
            .filter((s) => s.domain === domain && s.masteryScore < 50)
            .sort((a, b) => a.masteryScore - b.masteryScore)
            .map((s) => s.topic);

        // Find topics not seen recently
        const staleTopics = skillProfile
            .filter((s) => s.domain === domain)
            .sort((a, b) => new Date(a.lastSeen) - new Date(b.lastSeen))
            .slice(0, 3)
            .map((s) => s.topic);

        return {
            priority: [...new Set([...weakTopics, ...staleTopics])],
            weakTopics,
            staleTopics,
        };
    }

    /**
     * Adjust question parameters based on performance
     */
    adjustQuestionParams(currentParams, performance) {
        const adjusted = { ...currentParams };

        if (performance.averageScore > 7.5) {
            // Increase complexity
            if (adjusted.difficulty === 'Easy') adjusted.difficulty = 'Medium';
            else if (adjusted.difficulty === 'Medium') adjusted.difficulty = 'Hard';
        } else if (performance.averageScore < 4) {
            // Decrease complexity
            if (adjusted.difficulty === 'Hard') adjusted.difficulty = 'Medium';
            else if (adjusted.difficulty === 'Medium') adjusted.difficulty = 'Easy';
        }

        return adjusted;
    }
}

module.exports = { InterviewerService };
