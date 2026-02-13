/**
 * Policy Engine Service
 * 
 * Configurable rule-based decision engine for interview session flow.
 * 
 * Decisions:
 * - When to trigger follow-up questions
 * - When to increase/decrease difficulty
 * - When to switch topics
 * - When to end session
 * 
 * Rules are configurable via:
 * - Default JSON config
 * - Database overrides
 * - Runtime modifications
 */

const { prisma } = require('../db/prisma');

// ============= DEFAULT POLICY RULES =============

const DEFAULT_RULES = {
    // Scoring thresholds
    thresholds: {
        lowScore: 4.0,           // Score below this triggers remediation
        highScore: 7.5,          // Score above this triggers advancement
        passScore: 5.0,          // Minimum passing score
        excellentScore: 9.0,     // Exceptional performance
    },

    // Follow-up question rules
    followUp: {
        enabled: true,
        maxDepth: 3,                    // Maximum follow-up depth
        triggerBelowScore: 7.5,         // Trigger follow-up if below this
        skipAboveScore: 9.0,            // Skip follow-up if above this
        easyFollowUpThreshold: 4.0,     // Use easier follow-up below this
    },

    // Difficulty adjustment rules
    difficulty: {
        autoAdjust: true,
        increaseAfterStreak: 2,         // Increase after N consecutive high scores
        decreaseAfterStreak: 2,         // Decrease after N consecutive low scores
        increaseThreshold: 7.5,         // Score needed to count toward increase
        decreaseThreshold: 4.0,         // Score that counts toward decrease
        levels: ['Easy', 'Medium', 'Hard'],
    },

    // Topic switching rules
    topicSwitch: {
        enabled: true,
        consecutiveLowScores: 2,        // Switch after N low scores in same topic
        lowScoreThreshold: 4.0,         // What counts as "low"
        cooldownQuestions: 3,           // Questions before returning to topic
    },

    // Session limits
    sessionLimits: {
        maxQuestions: 20,               // Maximum questions per session
        maxDurationMinutes: 60,         // Maximum session duration
        minQuestionsForReport: 3,       // Minimum questions needed for report
        warningAtQuestionsRemaining: 3, // Warn user when N questions left
    },

    // Scoring formula weights
    scoring: {
        mustHaveWeight: 6,
        goodToHaveWeight: 3,
        clarityWeight: 1,
        redFlagPenalty: 1.5,
        partialCreditMultiplier: 0.5,
    },

    // Adaptive features
    adaptive: {
        enableMasteryTracking: true,
        masteryDecayFactor: 0.8,        // oldMastery * factor + newScore * (1-factor)
        prioritizeWeakTopics: true,
        weakTopicBoostFactor: 1.5,      // Probability boost for weak topics
    },
};

// ============= POLICY ENGINE CLASS =============

class PolicyEngine {
    constructor(customRules = {}) {
        this.rules = this.mergeRules(DEFAULT_RULES, customRules);
        this.ruleCache = new Map();
    }

    /**
     * Deep merge rules objects
     */
    mergeRules(defaults, custom) {
        const result = { ...defaults };

        for (const key in custom) {
            if (custom[key] && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
                result[key] = { ...defaults[key], ...custom[key] };
            } else {
                result[key] = custom[key];
            }
        }

        return result;
    }

    /**
     * Load rules from database (with caching)
     */
    async loadRulesFromDB(ruleSetId = 'default') {
        const cacheKey = `rules_${ruleSetId}`;

        if (this.ruleCache.has(cacheKey)) {
            const cached = this.ruleCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
                return cached.rules;
            }
        }

        try {
            const dbRules = await prisma.policyRule.findUnique({
                where: { id: ruleSetId },
            });

            if (dbRules) {
                const rules = this.mergeRules(DEFAULT_RULES, dbRules.config);
                this.ruleCache.set(cacheKey, { rules, timestamp: Date.now() });
                return rules;
            }
        } catch (error) {
            // Table might not exist, use defaults
            console.warn('[PolicyEngine] Could not load DB rules:', error.message);
        }

        return this.rules;
    }

    /**
     * Update rules at runtime
     */
    updateRules(newRules) {
        this.rules = this.mergeRules(this.rules, newRules);
    }

    /**
     * Get current rules (for debugging/display)
     */
    getRules() {
        return { ...this.rules };
    }

    // ============= DECISION METHODS =============

    /**
     * Main decision method - determines next action based on session state
     */
    decide(sessionState) {
        const {
            currentScore,
            questionNumber,
            totalQuestions = 0,
            recentScores = [],
            currentTopic,
            currentDifficulty,
            followUpDepth = 0,
            sessionStartTime,
            topicHistory = [],
        } = sessionState;

        const rules = this.rules;
        const decisions = [];

        // 1. Check session limits
        const limitDecision = this.checkSessionLimits(questionNumber, sessionStartTime);
        if (limitDecision) {
            return limitDecision;
        }

        // 2. Check if should end soon (warning)
        const warningDecision = this.checkSessionWarning(questionNumber);
        if (warningDecision) {
            decisions.push(warningDecision);
        }

        // 3. Check topic switching (consecutive low scores)
        const topicDecision = this.checkTopicSwitch(currentScore, currentTopic, recentScores);
        if (topicDecision) {
            return topicDecision;
        }

        // 4. Check difficulty adjustment
        const difficultyDecision = this.checkDifficultyAdjustment(currentScore, currentDifficulty, recentScores);
        if (difficultyDecision) {
            decisions.push(difficultyDecision);
        }

        // 5. Check follow-up question need
        const followUpDecision = this.checkFollowUp(currentScore, followUpDepth);
        if (followUpDecision) {
            return { ...followUpDecision, additionalDecisions: decisions };
        }

        // Default: continue with same settings
        return {
            action: 'continue',
            reason: 'Normal progression',
            difficulty: currentDifficulty,
            topic: currentTopic,
            followUpDepth: 0,
            additionalDecisions: decisions,
        };
    }

    /**
     * Check if session limits are reached
     */
    checkSessionLimits(questionNumber, sessionStartTime) {
        const { maxQuestions, maxDurationMinutes } = this.rules.sessionLimits;

        // Question limit
        if (questionNumber >= maxQuestions) {
            return {
                action: 'end_session',
                reason: `Question limit reached (${maxQuestions})`,
                endReason: 'question_limit',
            };
        }

        // Duration limit
        if (sessionStartTime) {
            const durationMs = Date.now() - new Date(sessionStartTime).getTime();
            const durationMinutes = durationMs / (1000 * 60);

            if (durationMinutes >= maxDurationMinutes) {
                return {
                    action: 'end_session',
                    reason: `Time limit reached (${maxDurationMinutes} minutes)`,
                    endReason: 'time_limit',
                };
            }
        }

        return null;
    }

    /**
     * Check if should warn about session ending
     */
    checkSessionWarning(questionNumber) {
        const { maxQuestions, warningAtQuestionsRemaining } = this.rules.sessionLimits;
        const remaining = maxQuestions - questionNumber;

        if (remaining <= warningAtQuestionsRemaining && remaining > 0) {
            return {
                type: 'warning',
                message: `${remaining} questions remaining in session`,
            };
        }

        return null;
    }

    /**
     * Check if should switch topic (consecutive low scores)
     */
    checkTopicSwitch(currentScore, currentTopic, recentScores) {
        if (!this.rules.topicSwitch.enabled) return null;

        const { consecutiveLowScores, lowScoreThreshold } = this.rules.topicSwitch;

        // Get scores in current topic
        const topicScores = recentScores
            .filter(s => s.topic === currentTopic)
            .slice(0, consecutiveLowScores);

        // Check if all recent scores are low
        if (topicScores.length >= consecutiveLowScores) {
            const allLow = topicScores.every(s => s.score < lowScoreThreshold);

            if (allLow) {
                return {
                    action: 'switch_topic',
                    reason: `${consecutiveLowScores} consecutive low scores in "${currentTopic}"`,
                    fromTopic: currentTopic,
                    suggestedDifficulty: 'Easy', // Start easier in new topic
                    cooldownQuestions: this.rules.topicSwitch.cooldownQuestions,
                };
            }
        }

        return null;
    }

    /**
     * Check if difficulty should be adjusted
     */
    checkDifficultyAdjustment(currentScore, currentDifficulty, recentScores) {
        if (!this.rules.difficulty.autoAdjust) return null;

        const {
            increaseAfterStreak,
            decreaseAfterStreak,
            increaseThreshold,
            decreaseThreshold,
            levels,
        } = this.rules.difficulty;

        const currentLevelIndex = levels.indexOf(currentDifficulty);

        // Check for increase (consecutive high scores)
        const recentHighScores = recentScores
            .slice(0, increaseAfterStreak)
            .filter(s => s.score >= increaseThreshold);

        if (recentHighScores.length >= increaseAfterStreak && currentLevelIndex < levels.length - 1) {
            return {
                type: 'difficulty_change',
                action: 'increase_difficulty',
                reason: `${increaseAfterStreak} consecutive high scores`,
                fromDifficulty: currentDifficulty,
                toDifficulty: levels[currentLevelIndex + 1],
            };
        }

        // Check for decrease (consecutive low scores)
        const recentLowScores = recentScores
            .slice(0, decreaseAfterStreak)
            .filter(s => s.score < decreaseThreshold);

        if (recentLowScores.length >= decreaseAfterStreak && currentLevelIndex > 0) {
            return {
                type: 'difficulty_change',
                action: 'decrease_difficulty',
                reason: `${decreaseAfterStreak} consecutive low scores`,
                fromDifficulty: currentDifficulty,
                toDifficulty: levels[currentLevelIndex - 1],
            };
        }

        return null;
    }

    /**
     * Check if follow-up question is needed
     */
    checkFollowUp(currentScore, currentFollowUpDepth) {
        if (!this.rules.followUp.enabled) return null;

        const {
            maxDepth,
            triggerBelowScore,
            skipAboveScore,
            easyFollowUpThreshold,
        } = this.rules.followUp;

        // Skip if already at max depth
        if (currentFollowUpDepth >= maxDepth) {
            return null;
        }

        // Skip if score is excellent
        if (currentScore >= skipAboveScore) {
            return null;
        }

        // Trigger follow-up if score below threshold
        if (currentScore < triggerBelowScore) {
            const followUpType = currentScore < easyFollowUpThreshold ? 'easy' : 'same';

            return {
                action: 'follow_up',
                reason: `Score ${currentScore.toFixed(1)} below threshold`,
                followUpType,
                followUpDepth: currentFollowUpDepth + 1,
                maxDepth,
            };
        }

        return null;
    }

    // ============= SCORING HELPERS =============

    /**
     * Calculate score using policy weights
     */
    calculateScore(coverage, answerQuality, redFlagsCount) {
        const {
            mustHaveWeight,
            goodToHaveWeight,
            clarityWeight,
            redFlagPenalty,
            partialCreditMultiplier,
        } = this.rules.scoring;

        // Must-have score
        const mustTotal = coverage.mustHave.covered + coverage.mustHave.partial + coverage.mustHave.missing;
        const mustScore = mustTotal > 0
            ? ((coverage.mustHave.covered + coverage.mustHave.partial * partialCreditMultiplier) / mustTotal) * mustHaveWeight
            : mustHaveWeight;

        // Good-to-have score
        const goodTotal = coverage.goodToHave.covered + coverage.goodToHave.partial + coverage.goodToHave.missing;
        const goodScore = goodTotal > 0
            ? ((coverage.goodToHave.covered + coverage.goodToHave.partial * partialCreditMultiplier) / goodTotal) * goodToHaveWeight
            : 0;

        // Clarity score
        const clarityScore = ((answerQuality.clarity + answerQuality.structure) / 2) * clarityWeight;

        // Penalty
        const penalty = redFlagsCount * redFlagPenalty;

        // Final score (clamped 0-10)
        const rawScore = mustScore + goodScore + clarityScore - penalty;
        return Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10));
    }

    /**
     * Classify score into grade
     */
    classifyScore(score) {
        const { lowScore, passScore, highScore, excellentScore } = this.rules.thresholds;

        if (score >= excellentScore) return { grade: 'A+', label: 'Excellent', color: 'green' };
        if (score >= highScore) return { grade: 'A', label: 'Strong', color: 'green' };
        if (score >= passScore) return { grade: 'B', label: 'Satisfactory', color: 'yellow' };
        if (score >= lowScore) return { grade: 'C', label: 'Needs Improvement', color: 'orange' };
        return { grade: 'D', label: 'Poor', color: 'red' };
    }

    // ============= MASTERY TRACKING =============

    /**
     * Calculate new mastery score
     */
    calculateMastery(oldMastery, newScore) {
        const { masteryDecayFactor } = this.rules.adaptive;
        const normalizedScore = newScore / 10;

        return oldMastery * masteryDecayFactor + normalizedScore * (1 - masteryDecayFactor);
    }

    /**
     * Select next topic based on mastery and recent history
     */
    selectNextTopic(skillProfile, recentTopics = [], availableTopics = []) {
        if (!this.rules.adaptive.prioritizeWeakTopics || availableTopics.length === 0) {
            // Random selection
            return availableTopics[Math.floor(Math.random() * availableTopics.length)];
        }

        const { weakTopicBoostFactor, cooldownQuestions } = {
            ...this.rules.adaptive,
            ...this.rules.topicSwitch,
        };

        // Filter out recently used topics (cooldown)
        const cooldownTopics = new Set(recentTopics.slice(0, cooldownQuestions));
        const eligibleTopics = availableTopics.filter(t => !cooldownTopics.has(t));

        if (eligibleTopics.length === 0) {
            return availableTopics[0]; // Fallback if all on cooldown
        }

        // Weight topics by inverse mastery (lower mastery = higher weight)
        const weightedTopics = eligibleTopics.map(topic => {
            const skill = skillProfile.find(s => s.topic === topic);
            const mastery = skill?.masteryScore || 50;

            // Lower mastery = higher weight
            const weight = Math.pow((100 - mastery) / 100, weakTopicBoostFactor);

            return { topic, weight, mastery };
        });

        // Weighted random selection
        const totalWeight = weightedTopics.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of weightedTopics) {
            random -= item.weight;
            if (random <= 0) {
                return item.topic;
            }
        }

        return eligibleTopics[0];
    }

    // ============= REPORT GENERATION =============

    /**
     * Determine if session has enough data for report
     */
    canGenerateReport(questionCount) {
        return questionCount >= this.rules.sessionLimits.minQuestionsForReport;
    }

    /**
     * Get session summary classification
     */
    getSessionSummary(events) {
        if (events.length === 0) {
            return { overallGrade: 'N/A', recommendation: 'No questions answered' };
        }

        const avgScore = events.reduce((sum, e) => sum + (e.score || 0), 0) / events.length;
        const normalizedAvg = avgScore / 10; // Assuming scores stored as 0-100

        const classification = this.classifyScore(normalizedAvg * 10);

        return {
            overallGrade: classification.grade,
            overallLabel: classification.label,
            averageScore: Math.round(normalizedAvg * 100) / 10,
            questionsAnswered: events.length,
            recommendation: this.getRecommendation(normalizedAvg * 10, events),
        };
    }

    /**
     * Generate recommendation based on performance
     */
    getRecommendation(avgScore, events) {
        const { lowScore, highScore } = this.rules.thresholds;

        if (avgScore >= highScore) {
            return 'Great performance! Consider increasing difficulty or exploring advanced topics.';
        } else if (avgScore >= lowScore) {
            return 'Good progress. Focus on the topics where you scored lower for improvement.';
        } else {
            return 'Review fundamentals in your weak areas. Consider practicing with easier questions first.';
        }
    }
}

// ============= SINGLETON & EXPORTS =============

const policyEngine = new PolicyEngine();

module.exports = {
    PolicyEngine,
    policyEngine,
    DEFAULT_RULES,
};
