const { Injectable } = require('@nestjs/common');
const { SCORING } = require('../../config/constants');
const { clamp } = require('../../common/utils/clamp');

/**
 * Evaluator Agent - Responsible for answer evaluation and scoring
 * Uses rubric-based deterministic scoring
 */
@Injectable()
class EvaluatorService {
    constructor() {
        this.scoring = SCORING;
    }

    /**
     * Evaluate an answer against question rubric
     * @param {string} answer - User's answer
     * @param {Object} question - Question with rubric
     * @returns {Object} Evaluation result
     */
    async evaluate(answer, question) {
        const rubric = question.rubric;

        if (!rubric) {
            // No rubric available - return placeholder
            return {
                score: 5,
                covered: [],
                missing: [],
                wrongClaims: [],
                confidence: 0,
                feedback: 'Rubric not available for this question',
            };
        }

        // Extract points from answer (will use LLM in Phase 3)
        const extraction = await this.extractPoints(answer, rubric);

        // Calculate deterministic score
        const score = this.calculateScore(extraction, rubric);

        // Generate feedback
        const feedback = this.generateFeedback(extraction, rubric, score);

        return {
            score,
            covered: extraction.covered,
            missing: extraction.missing,
            wrongClaims: extraction.wrongClaims,
            confidence: extraction.confidence,
            feedback,
        };
    }

    /**
     * Extract covered points from answer
     * Placeholder - will be replaced by LLM in Phase 3
     */
    async extractPoints(answer, rubric) {
        const answerLower = answer.toLowerCase();

        // Simple keyword matching (placeholder for LLM)
        const covered = [];
        const missing = [];

        for (const point of rubric.mustHave || []) {
            const keywords = point.toLowerCase().split(/\s+/);
            const found = keywords.some((kw) => answerLower.includes(kw));
            if (found) {
                covered.push(point);
            } else {
                missing.push(point);
            }
        }

        const coveredGood = [];
        for (const point of rubric.goodToHave || []) {
            const keywords = point.toLowerCase().split(/\s+/);
            const found = keywords.some((kw) => answerLower.includes(kw));
            if (found) {
                coveredGood.push(point);
            }
        }

        // Check for red flags
        const wrongClaims = [];
        for (const flag of rubric.redFlags || []) {
            const keywords = flag.toLowerCase().split(/\s+/);
            const found = keywords.every((kw) => answerLower.includes(kw));
            if (found) {
                wrongClaims.push(flag);
            }
        }

        return {
            covered,
            coveredGood,
            missing,
            wrongClaims,
            confidence: 0.6, // Lower confidence for keyword matching
        };
    }

    /**
     * Calculate deterministic score using formula from doc.txt
     * mustScore  = (coveredMust / totalMust) * 6
     * bonusScore = (coveredGood / totalGood) * 3
     * penalty    = wrongClaimsCount * 1.5
     * finalScore = clamp(mustScore + bonusScore - penalty, 0, 10)
     */
    calculateScore(extraction, rubric) {
        const totalMust = rubric.mustHave?.length || 1;
        const totalGood = rubric.goodToHave?.length || 1;
        const coveredMust = extraction.covered?.length || 0;
        const coveredGood = extraction.coveredGood?.length || 0;
        const wrongCount = extraction.wrongClaims?.length || 0;

        const mustScore = (coveredMust / totalMust) * this.scoring.MUST_HAVE_WEIGHT;
        const bonusScore = (coveredGood / totalGood) * this.scoring.GOOD_TO_HAVE_WEIGHT;
        const penalty = wrongCount * this.scoring.WRONG_CLAIM_PENALTY;

        const finalScore = clamp(
            mustScore + bonusScore - penalty,
            this.scoring.MIN_SCORE,
            this.scoring.MAX_SCORE,
        );

        return Math.round(finalScore * 10) / 10; // Round to 1 decimal
    }

    /**
     * Generate feedback based on evaluation
     */
    generateFeedback(extraction, rubric, score) {
        const feedback = [];

        if (score >= 8) {
            feedback.push('Excellent answer! You covered the key concepts well.');
        } else if (score >= 6) {
            feedback.push('Good answer with room for improvement.');
        } else if (score >= 4) {
            feedback.push('Partial answer. Some key concepts were missed.');
        } else {
            feedback.push('The answer needs significant improvement.');
        }

        if (extraction.missing.length > 0) {
            feedback.push(`Missing points: ${extraction.missing.join(', ')}`);
        }

        if (extraction.wrongClaims.length > 0) {
            feedback.push(`Incorrect statements detected: ${extraction.wrongClaims.join(', ')}`);
        }

        if (extraction.covered.length > 0) {
            feedback.push(`Well covered: ${extraction.covered.join(', ')}`);
        }

        return feedback.join(' ');
    }
}

module.exports = { EvaluatorService };
