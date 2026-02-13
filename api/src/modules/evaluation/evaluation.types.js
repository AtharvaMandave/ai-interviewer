/**
 * Point extraction result
 * @typedef {Object} ExtractionResult
 * @property {string[]} covered
 * @property {string[]} coveredGood
 * @property {string[]} missing
 * @property {string[]} wrongClaims
 * @property {number} confidence
 */

/**
 * Scoring breakdown
 * @typedef {Object} ScoreBreakdown
 * @property {number} mustScore
 * @property {number} bonusScore
 * @property {number} penalty
 * @property {number} rawScore
 */

/**
 * Full evaluation result
 * @typedef {Object} EvaluationResult
 * @property {number} score
 * @property {string} grade
 * @property {string[]} covered
 * @property {string[]} coveredGood
 * @property {string[]} missing
 * @property {string[]} wrongClaims
 * @property {number} confidence
 * @property {ScoreBreakdown} breakdown
 * @property {Object} coverage
 * @property {string} feedback
 * @property {boolean} needsFollowUp
 */

module.exports = {};
