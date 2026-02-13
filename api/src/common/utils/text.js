/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string}
 */
function truncate(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Clean and normalize text
 * @param {string} text - Text to clean
 * @returns {string}
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Extract keywords from text
 * @param {string} text - Source text
 * @param {number} minLength - Minimum keyword length
 * @returns {string[]}
 */
function extractKeywords(text, minLength = 3) {
    if (!text) return [];

    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
        'it', 'its', 'as', 'from', 'into', 'through', 'during', 'before', 'after',
    ]);

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= minLength && !stopWords.has(word))
        .filter((word, index, self) => self.indexOf(word) === index);
}

/**
 * Calculate token count estimate (rough approximation)
 * @param {string} text - Text to count
 * @returns {number}
 */
function estimateTokens(text) {
    if (!text) return 0;
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
}

module.exports = { truncate, cleanText, extractKeywords, estimateTokens };
