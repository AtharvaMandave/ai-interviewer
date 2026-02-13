const { Injectable } = require('@nestjs/common');
const { SCORING } = require('../../config/constants');
const { clamp } = require('../../common/utils/clamp');

/**
 * Deterministic scoring formula from doc.txt
 * 
 * mustScore  = (coveredMust / totalMust) × 6
 * bonusScore = (coveredGood / totalGood) × 3
 * penalty    = wrongClaimsCount × 1.5
 * finalScore = clamp(mustScore + bonusScore - penalty, 0, 10)
 */
@Injectable()
class ScoringFormula {
    constructor() {
        this.weights = SCORING;
    }

    /**
     * Calculate score using deterministic formula
     */
    calculate(extraction, rubric) {
        const totalMust = rubric.mustHave?.length || 1;
        const totalGood = rubric.goodToHave?.length || 1;
        const coveredMust = extraction.covered?.length || 0;
        const coveredGood = extraction.coveredGood?.length || 0;
        const wrongCount = extraction.wrongClaims?.length || 0;

        const mustScore = (coveredMust / totalMust) * this.weights.MUST_HAVE_WEIGHT;
        const bonusScore = (coveredGood / totalGood) * this.weights.GOOD_TO_HAVE_WEIGHT;
        const penalty = wrongCount * this.weights.WRONG_CLAIM_PENALTY;

        const rawScore = mustScore + bonusScore - penalty;
        const finalScore = clamp(rawScore, this.weights.MIN_SCORE, this.weights.MAX_SCORE);

        return {
            score: Math.round(finalScore * 10) / 10,
            breakdown: {
                mustScore: Math.round(mustScore * 100) / 100,
                bonusScore: Math.round(bonusScore * 100) / 100,
                penalty: Math.round(penalty * 100) / 100,
                rawScore: Math.round(rawScore * 100) / 100,
            },
            coverage: {
                mustHave: `${coveredMust}/${totalMust}`,
                goodToHave: `${coveredGood}/${totalGood}`,
                wrongClaims: wrongCount,
            },
        };
    }

    /**
     * Get score grade
     */
    getGrade(score) {
        if (score >= 9) return 'A+';
        if (score >= 8) return 'A';
        if (score >= 7) return 'B+';
        if (score >= 6) return 'B';
        if (score >= 5) return 'C';
        if (score >= 4) return 'D';
        return 'F';
    }

    /**
     * Check if follow-up needed
     */
    needsFollowUp(score, extraction) {
        return (
            score < 4 ||
            extraction.missing.length > 2 ||
            extraction.wrongClaims.length > 0
        );
    }
}

module.exports = { ScoringFormula };
