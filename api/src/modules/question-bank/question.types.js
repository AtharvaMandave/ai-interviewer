/**
 * Question type definition
 * @typedef {Object} Question
 * @property {string} id
 * @property {string} domain - DSA, Java, DBMS, OS, HR, etc.
 * @property {string} topic - e.g., "java.hashmap"
 * @property {string} [subTopic]
 * @property {string} difficulty - Easy, Medium, Hard
 * @property {string} text - Question text
 * @property {string[]} tags
 * @property {string[]} hints
 * @property {string[]} companyTags
 * @property {boolean} isActive
 * @property {Rubric} [rubric]
 */

/**
 * Create question DTO
 * @typedef {Object} CreateQuestionDto
 * @property {string} domain
 * @property {string} topic
 * @property {string} [subTopic]
 * @property {string} difficulty
 * @property {string} text
 * @property {string[]} [tags]
 * @property {string[]} [hints]
 * @property {string[]} [companyTags]
 * @property {CreateRubricDto} [rubric]
 */

/**
 * Question filter criteria
 * @typedef {Object} QuestionFilters
 * @property {string} [domain]
 * @property {string} [difficulty]
 * @property {string} [topic]
 * @property {boolean} [isActive]
 * @property {string[]} [excludeIds]
 * @property {number} [skip]
 * @property {number} [take]
 */

/**
 * Question selection criteria based on session
 * @typedef {Object} SelectionCriteria
 * @property {string} domain
 * @property {string} difficulty
 * @property {string[]} askedQuestionIds
 * @property {string} [currentTopic]
 * @property {string[]} [weakTopics]
 */

module.exports = {};
