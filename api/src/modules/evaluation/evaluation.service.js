const { Injectable } = require('@nestjs/common');
const { LLMService } = require('../llm/llm.service');
const { RubricService } = require('../rubric/rubric.service');
const { ScoringFormula } = require('./scoring.formula');
const { SemanticMatcher } = require('./semantic.matcher');
const { extractPointsPrompt } = require('../llm/prompts/extract-points.prompt');
const { feedbackPrompt } = require('../llm/prompts/feedback.prompt');

/**
 * Evaluation Service - Full answer evaluation pipeline
 */
@Injectable()
class EvaluationService {
    constructor(
        llmService,
        rubricService,
        scoringFormula,
        semanticMatcher,
    ) {
        this.llm = llmService;
        this.rubricService = rubricService;
        this.scoring = scoringFormula;
        this.matcher = semanticMatcher;
    }

    /**
     * Full evaluation pipeline
     */
    async evaluate(answer, question) {
        // Step 1: Get or generate rubric
        let rubric = question.rubric;
        if (!rubric) {
            rubric = await this.rubricService.getRubric(question.id);
        }

        if (!rubric) {
            return this.createPlaceholderEvaluation();
        }

        // Step 2: Extract points from answer
        const extraction = await this.extractPoints(answer, question.text, rubric);

        // Step 3: Calculate deterministic score
        const scoreResult = this.scoring.calculate(extraction, rubric);

        // Step 4: Generate feedback
        const feedback = await this.generateFeedback(question.text, answer, {
            score: scoreResult.score,
            covered: extraction.covered,
            missing: extraction.missing,
            wrongClaims: extraction.wrongClaims,
        });

        return {
            score: scoreResult.score,
            grade: this.scoring.getGrade(scoreResult.score),
            covered: extraction.covered,
            coveredGood: extraction.coveredGood,
            missing: extraction.missing,
            wrongClaims: extraction.wrongClaims,
            confidence: extraction.confidence,
            breakdown: scoreResult.breakdown,
            coverage: scoreResult.coverage,
            feedback,
            needsFollowUp: this.scoring.needsFollowUp(scoreResult.score, extraction),
        };
    }

    /**
     * Extract points from answer using LLM
     */
    async extractPoints(answer, question, rubric) {
        try {
            const prompt = extractPointsPrompt(question, answer, rubric);
            const result = await this.llm.generateJSON(prompt);

            return {
                covered: result.covered || [],
                coveredGood: result.coveredGood || [],
                missing: result.missing || [],
                wrongClaims: result.wrongClaims || [],
                confidence: result.confidence || 0.7,
            };
        } catch (error) {
            console.error('LLM extraction failed, using keyword fallback:', error.message);
            return this.keywordFallback(answer, rubric);
        }
    }

    /**
     * Keyword-based fallback when LLM fails
     */
    keywordFallback(answer, rubric) {
        const answerLower = answer.toLowerCase();
        const covered = [];
        const missing = [];

        for (const point of rubric.mustHave || []) {
            const keywords = point.toLowerCase().split(/\s+/);
            const found = keywords.some((kw) => kw.length > 3 && answerLower.includes(kw));
            if (found) {
                covered.push(point);
            } else {
                missing.push(point);
            }
        }

        const coveredGood = [];
        for (const point of rubric.goodToHave || []) {
            const keywords = point.toLowerCase().split(/\s+/);
            const found = keywords.some((kw) => kw.length > 3 && answerLower.includes(kw));
            if (found) {
                coveredGood.push(point);
            }
        }

        const wrongClaims = [];
        for (const flag of rubric.redFlags || []) {
            if (answerLower.includes(flag.toLowerCase())) {
                wrongClaims.push(flag);
            }
        }

        return {
            covered,
            coveredGood,
            missing,
            wrongClaims,
            confidence: 0.5,
        };
    }

    /**
     * Generate feedback using LLM
     */
    async generateFeedback(question, answer, evaluation) {
        try {
            const prompt = feedbackPrompt(question, answer, evaluation);
            return await this.llm.generate(prompt, { maxTokens: 200 });
        } catch (error) {
            return this.generateStaticFeedback(evaluation);
        }
    }

    /**
     * Static feedback fallback
     */
    generateStaticFeedback(evaluation) {
        const parts = [];

        if (evaluation.score >= 8) {
            parts.push('Excellent answer!');
        } else if (evaluation.score >= 6) {
            parts.push('Good answer with room for improvement.');
        } else if (evaluation.score >= 4) {
            parts.push('Partial answer. Key concepts were missed.');
        } else {
            parts.push('The answer needs significant improvement.');
        }

        if (evaluation.covered.length > 0) {
            parts.push(`Well covered: ${evaluation.covered.slice(0, 2).join(', ')}.`);
        }

        if (evaluation.missing.length > 0) {
            parts.push(`Missing: ${evaluation.missing.slice(0, 2).join(', ')}.`);
        }

        return parts.join(' ');
    }

    /**
     * Placeholder evaluation when no rubric available
     */
    createPlaceholderEvaluation() {
        return {
            score: 5,
            grade: 'C',
            covered: [],
            coveredGood: [],
            missing: [],
            wrongClaims: [],
            confidence: 0,
            breakdown: null,
            coverage: null,
            feedback: 'Rubric not available for detailed evaluation.',
            needsFollowUp: false,
        };
    }
}

module.exports = { EvaluationService };
