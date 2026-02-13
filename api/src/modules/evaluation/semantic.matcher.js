const { Injectable } = require('@nestjs/common');
const { cosineSimilarity } = require('../../common/utils/cosine');

/**
 * Semantic Matcher - Matches answer points to rubric using embeddings
 * Placeholder for Phase 6 vector-based matching
 */
@Injectable()
class SemanticMatcher {
    constructor() {
        this.similarityThreshold = 0.75;
    }

    /**
     * Match answer text to rubric points using embeddings
     * Returns covered points based on semantic similarity
     */
    async match(answerEmbedding, rubricPointEmbeddings) {
        // Will implement with real embeddings in Phase 6
        // For now, return empty - keyword matching is primary
        return {
            covered: [],
            scores: {},
        };
    }

    /**
     * Check if two texts are semantically similar
     */
    async isSimilar(text1Embedding, text2Embedding) {
        const similarity = cosineSimilarity(text1Embedding, text2Embedding);
        return {
            similar: similarity >= this.similarityThreshold,
            score: similarity,
        };
    }

    /**
     * Get best match from candidates
     */
    async findBestMatch(targetEmbedding, candidateEmbeddings) {
        let bestMatch = null;
        let bestScore = 0;

        for (const [id, embedding] of Object.entries(candidateEmbeddings)) {
            const similarity = cosineSimilarity(targetEmbedding, embedding);
            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = id;
            }
        }

        return {
            match: bestMatch,
            score: bestScore,
            confident: bestScore >= this.similarityThreshold,
        };
    }
}

module.exports = { SemanticMatcher };
