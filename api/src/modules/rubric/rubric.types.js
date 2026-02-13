/**
 * Rubric structure
 * @typedef {Object} Rubric
 * @property {string} id
 * @property {string} questionId
 * @property {string[]} mustHave - Core points (3-8 items)
 * @property {string[]} goodToHave - Bonus points (0-6 items)
 * @property {string[]} redFlags - Wrong claims (0-8 items)
 * @property {string} [idealAnswer] - Full ideal answer text
 * @property {string[]} keywords - Extracted keywords for matching
 */

/**
 * Create rubric DTO
 * @typedef {Object} CreateRubricDto
 * @property {string[]} mustHave
 * @property {string[]} [goodToHave]
 * @property {string[]} [redFlags]
 * @property {string} [idealAnswer]
 */

/**
 * Rubric validation result
 * @typedef {Object} RubricValidationResult
 * @property {boolean} valid
 * @property {string[]} errors
 */

/**
 * Example rubric from doc.txt
 * {
 *   "mustHave": [
 *     "hashing",
 *     "bucket array",
 *     "collision handling",
 *     "load factor",
 *     "rehashing"
 *   ],
 *   "goodToHave": [
 *     "treeification in Java 8",
 *     "equals/hashCode contract",
 *     "time complexity"
 *   ],
 *   "redFlags": [
 *     "HashMap maintains insertion order",
 *     "Collision always overwrites value"
 *   ]
 * }
 */

module.exports = {};
