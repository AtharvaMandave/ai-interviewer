/**
 * Session state in Redis
 * @typedef {Object} SessionMemory
 * @property {string} sessionId
 * @property {string} userId
 * @property {string} domain
 * @property {string} difficulty
 * @property {number} questionCount
 * @property {string[]} askedQuestionIds
 * @property {Object} lastEvaluation
 */

/**
 * Vector search result
 * @typedef {Object} VectorMatch
 * @property {string} id
 * @property {number} score
 * @property {Object} metadata
 */

module.exports = {};
