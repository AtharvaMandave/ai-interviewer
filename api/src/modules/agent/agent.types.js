/**
 * Decision from policy engine
 * @typedef {Object} PolicyDecisionResult
 * @property {string} action - PolicyDecision enum value
 * @property {string} reason
 * @property {string[]} [focusPoints]
 */

/**
 * Evaluation result from evaluator
 * @typedef {Object} EvaluationResult
 * @property {number} score - 0-10 score
 * @property {string[]} covered - Points covered in answer
 * @property {string[]} coveredGood - Good-to-have points covered
 * @property {string[]} missing - Missing must-have points
 * @property {string[]} wrongClaims - Incorrect statements
 * @property {number} confidence - 0-1 confidence score
 * @property {string} feedback - Generated feedback
 */

/**
 * Answer cycle result from orchestrator
 * @typedef {Object} AnswerCycleResult
 * @property {EvaluationResult} evaluation
 * @property {PolicyDecisionResult} decision
 * @property {Object} nextQuestion
 * @property {boolean} shouldEnd
 * @property {Object} updatedState
 */

/**
 * Context for policy decision
 * @typedef {Object} PolicyContext
 * @property {number} lastScore
 * @property {number} followUpDepth
 * @property {number} consecutiveLowScores
 * @property {number} questionsAsked
 * @property {string[]} missingCorePoints
 * @property {string[]} wrongClaims
 */

module.exports = {};
