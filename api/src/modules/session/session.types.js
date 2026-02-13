/**
 * Session state stored in Redis
 * @typedef {Object} SessionState
 * @property {string} sessionId
 * @property {string} userId
 * @property {string} domain
 * @property {string} mode
 * @property {string} difficulty
 * @property {number} questionCount
 * @property {number} followUpDepth
 * @property {string} currentTopic
 * @property {string} currentQuestionId
 * @property {string[]} askedQuestionIds
 * @property {string[]} weakTopics
 * @property {LastEvaluation} lastEvaluation
 */

/**
 * Last evaluation result
 * @typedef {Object} LastEvaluation
 * @property {number} score
 * @property {string[]} covered
 * @property {string[]} missing
 * @property {string[]} wrongClaims
 */

/**
 * Question response to client
 * @typedef {Object} QuestionResponse
 * @property {number} questionNumber
 * @property {string} questionId
 * @property {string} question
 * @property {string} topic
 * @property {string} difficulty
 * @property {string} domain
 * @property {string[]} hints
 * @property {string[]} tags
 */

/**
 * Answer submission response
 * @typedef {Object} AnswerResponse
 * @property {string} eventId
 * @property {string} questionId
 * @property {number} questionNumber
 * @property {Object} feedback
 */

/**
 * Session summary
 * @typedef {Object} SessionSummary
 * @property {string} sessionId
 * @property {string} status
 * @property {number} totalScore
 * @property {number} questionsAnswered
 * @property {number} duration
 * @property {string} domain
 */

module.exports = {};
