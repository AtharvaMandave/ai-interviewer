/**
 * Evaluation Service
 * 
 * High-level service that combines LLM capabilities with rubric evaluation.
 * Provides methods for: rubric generation, answer evaluation, follow-up questions, feedback.
 */

const { llmService } = require('./llm.service');
const {
    generateRubricPrompt,
    generatePointExtractionPrompt,
    generateFeedbackPrompt,
    generateFollowUpPrompt,
    generateSemanticMatchPrompt,
    generateRoadmapPrompt,
} = require('./prompts');

class EvaluationService {
    /**
     * Generate a rubric for a question using LLM
     */
    sanitizeIndexArray(arr, maxLen) {
    if (!Array.isArray(arr)) return [];
    return [...new Set(
        arr
            .map(x => Number(x))
            .filter(x => Number.isInteger(x) && x >= 0 && x < maxLen)
    )];
}

    async generateRubric(question) {
        const { systemPrompt, prompt } = generateRubricPrompt(question);

        const rubric = await llmService.generateJSON(prompt, {
            systemPrompt,
            temperature: 0.3, // Lower temp for consistent rubrics
            maxTokens: 1500,
        });

        // Validate rubric structure
        if (!rubric.mustHave || !Array.isArray(rubric.mustHave)) {
            throw new Error('Invalid rubric: missing mustHave array');
        }

        return {
            mustHave: rubric.mustHave || [],
            goodToHave: rubric.goodToHave || [],
            redFlags: rubric.redFlags || [],
            keywords: rubric.keywords || [],
            generatedAt: new Date().toISOString(),
            source: 'llm',
        };
    }

    /**
     * Evaluate an answer against a rubric
     */
    async evaluateAnswer(question, answer, rubric) {
        const { systemPrompt, prompt } = generatePointExtractionPrompt(question, answer, rubric);

        const evaluation = await llmService.generateJSON(prompt, {
            systemPrompt,
            temperature: 0.2, // Low temp for consistent scoring
            maxTokens: 1000,
        });

        // Calculate score based on covered points
        const mustHaveCount = rubric.mustHave.length;
        const coveredMustHave = evaluation.coveredMustHave?.length || 0;
        const coveredGoodToHave = evaluation.coveredGoodToHave?.length || 0;
        const redFlagsTriggered = evaluation.triggeredRedFlags?.length || 0;

        // Score calculation: 
        // - Base: (covered must-have / total must-have) * 80
        // - Bonus: good-to-have adds up to 20 points
        // - Penalty: each red flag -5 points
        let score = mustHaveCount > 0 ? (coveredMustHave / mustHaveCount) * 80 : 60;
        score += Math.min(coveredGoodToHave * 5, 20); // Max 20 bonus
        score -= redFlagsTriggered * 5; // -5 per red flag
        score = Math.max(0, Math.min(100, Math.round(score)));

        // Map indices to actual points
        const pointsCovered = (evaluation.coveredMustHave || [])
            .map(i => rubric.mustHave[i])
            .filter(Boolean);
        const pointsMissed = rubric.mustHave
            .filter((_, i) => !(evaluation.coveredMustHave || []).includes(i));
        const bonusPointsCovered = (evaluation.coveredGoodToHave || [])
            .map(i => rubric.goodToHave[i])
            .filter(Boolean);
        const redFlagsFound = (evaluation.triggeredRedFlags || [])
            .map(i => rubric.redFlags[i])
            .filter(Boolean);

        return {
            score,
            pointsCovered,
            pointsMissed,
            bonusPointsCovered,
            redFlagsTriggered: redFlagsFound,
            confidence: evaluation.confidence || 0.8,
            overallAssessment: evaluation.overallAssessment || '',
            rawEvaluation: evaluation,
        };
    }

    /**
     * Generate detailed feedback for an answer
     */
    async generateFeedback(question, answer, evaluation) {
        const { systemPrompt, prompt } = generateFeedbackPrompt(question, answer, evaluation);

        const feedback = await llmService.generateJSON(prompt, {
            systemPrompt,
            temperature: 0.5,
            maxTokens: 800,
        });

        return {
            summary: feedback.summary || 'Good attempt.',
            strengths: feedback.strengths || [],
            improvements: feedback.improvements || [],
            studyTip: feedback.studyTip || 'Keep practicing!',
        };
    }

    /**
     * Generate a follow-up question based on answer
     */
    async generateFollowUp(question, answer, evaluation, depth = 1) {
        const { systemPrompt, prompt } = generateFollowUpPrompt(question, answer, evaluation, depth);

        const followUp = await llmService.generateJSON(prompt, {
            systemPrompt,
            temperature: 0.6,
            maxTokens: 500,
        });

        return {
            question: followUp.followUpQuestion || 'Can you elaborate more?',
            intent: followUp.intent || 'Probe deeper understanding',
            expectedTopics: followUp.expectedTopics || [],
            difficulty: followUp.difficulty || "medium",
        };
    }

    /**
     * Generate personalized study roadmap
     */
    async generateRoadmap(userProfile) {
        const { systemPrompt, prompt } = generateRoadmapPrompt(userProfile);

        const roadmap = await llmService.generateJSON(prompt, {
            systemPrompt,
            temperature: 0.5,
            maxTokens: 2000,
        });

        return {
            title: roadmap.title || 'Your Study Plan',
            weeklyPlan: roadmap.weeklyPlan || {},
            resources: roadmap.resources || [],
            milestones: roadmap.milestones || [],
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Full evaluation pipeline: evaluate + feedback + optional follow-up
     */
    async fullEvaluation(question, answer, rubric, options = {}) {
        const { includeFollowUp = true, followUpDepth = 1 } = options;

        // Step 1: Evaluate answer
        const evaluation = await this.evaluateAnswer(question, answer, rubric);

        // Step 2: Generate feedback
        const feedback = await this.generateFeedback(question, answer, evaluation);

        // Step 3: Optionally generate follow-up
        let followUp = null;
        if (includeFollowUp && evaluation.score < 90) {
            followUp = await this.generateFollowUp(question, answer, evaluation, followUpDepth);
        }

        return {
            evaluation,
            feedback,
            followUp,
            timestamp: new Date().toISOString(),
        };
    }
}

// Singleton instance
const evaluationService = new EvaluationService();

module.exports = { EvaluationService, evaluationService };
