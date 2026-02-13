const { Injectable } = require('@nestjs/common');
const { POLICY_THRESHOLDS, SCORING } = require('../../config/constants');
const { PolicyDecision } = require('../../common/types/enums');

/**
 * Policy Engine - Decides next action based on session state
 * This is a deterministic rule-based engine
 */
@Injectable()
class PolicyEngine {
    constructor() {
        this.thresholds = POLICY_THRESHOLDS;
    }

    /**
     * Decide next action based on evaluation result and session state
     * @param {Object} context - Decision context
     * @returns {Object} Decision with action and reason
     */
    decide(context) {
        const {
            lastScore,
            followUpDepth,
            consecutiveLowScores,
            questionsAsked,
            missingCorePoints,
            wrongClaims,
        } = context;

        // Rule 1: End session if limit reached
        if (questionsAsked >= this.thresholds.MAX_QUESTIONS) {
            return {
                action: PolicyDecision.END_SESSION,
                reason: 'Maximum question limit reached',
            };
        }

        // Rule 2: Follow-up if missing core points or wrong claims
        if (
            (missingCorePoints && missingCorePoints.length > 0) ||
            (wrongClaims && wrongClaims.length > 0)
        ) {
            if (followUpDepth < this.thresholds.MAX_FOLLOW_UP_DEPTH) {
                return {
                    action: PolicyDecision.FOLLOW_UP,
                    reason: 'Missing core concepts or incorrect statements',
                    focusPoints: [...(missingCorePoints || []), ...(wrongClaims || [])],
                };
            }
        }

        // Rule 3: Follow-up on low score
        if (lastScore < this.thresholds.FOLLOW_UP_THRESHOLD) {
            if (followUpDepth < this.thresholds.MAX_FOLLOW_UP_DEPTH) {
                return {
                    action: PolicyDecision.FOLLOW_UP,
                    reason: 'Score below threshold, clarification needed',
                };
            }
        }

        // Rule 4: Switch topic after consecutive low scores
        if (consecutiveLowScores >= 2) {
            return {
                action: PolicyDecision.SWITCH_TOPIC,
                reason: 'Multiple low scores in current topic',
            };
        }

        // Rule 5: Increase difficulty on high score
        if (lastScore > this.thresholds.DIFFICULTY_UP_THRESHOLD) {
            return {
                action: PolicyDecision.INCREASE_DIFFICULTY,
                reason: 'Excellent answer, increasing challenge',
            };
        }

        // Default: Continue with same parameters
        return {
            action: PolicyDecision.CONTINUE,
            reason: 'Proceeding with next question',
        };
    }

    /**
     * Get difficulty adjustment
     * @param {string} currentDifficulty
     * @param {string} action
     * @returns {string} New difficulty
     */
    adjustDifficulty(currentDifficulty, action) {
        const levels = ['Easy', 'Medium', 'Hard'];
        const currentIndex = levels.indexOf(currentDifficulty);

        if (action === PolicyDecision.INCREASE_DIFFICULTY) {
            return levels[Math.min(currentIndex + 1, levels.length - 1)];
        }

        if (action === PolicyDecision.DECREASE_DIFFICULTY) {
            return levels[Math.max(currentIndex - 1, 0)];
        }

        return currentDifficulty;
    }

    /**
     * Validate policy rules
     */
    validateRules() {
        return {
            thresholds: this.thresholds,
            rules: [
                'END_SESSION: questionsAsked >= MAX_QUESTIONS',
                'FOLLOW_UP: missingCorePoints.length > 0 OR wrongClaims.length > 0',
                'FOLLOW_UP: lastScore < FOLLOW_UP_THRESHOLD',
                'SWITCH_TOPIC: consecutiveLowScores >= 2',
                'INCREASE_DIFFICULTY: lastScore > DIFFICULTY_UP_THRESHOLD',
                'CONTINUE: default action',
            ],
        };
    }
}

module.exports = { PolicyEngine };
