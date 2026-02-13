/**
 * LLM Provider configuration
 * @typedef {Object} LLMConfig
 * @property {string} provider - groq, openai, gemini
 * @property {string} apiKey
 * @property {string} model
 */

/**
 * Generation options
 * @typedef {Object} GenerationOptions
 * @property {number} [maxTokens=1000]
 * @property {number} [temperature=0.7]
 * @property {string} [model]
 */

/**
 * LLM Response
 * @typedef {Object} LLMResponse
 * @property {string} content
 * @property {string} model
 * @property {number} tokensUsed
 */

module.exports = {};
