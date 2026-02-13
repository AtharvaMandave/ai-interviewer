/**
 * Embeddings Service
 * 
 * Handles text embeddings for semantic matching.
 * Uses Groq/OpenAI for embeddings or falls back to simple TF-IDF-like approach.
 */

const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 256;

class EmbeddingsService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.cache = new Map(); // Simple in-memory cache for embeddings
    }

    /**
     * Get embedding for a text
     * Uses OpenAI if available, otherwise falls back to simple hashing
     */
    async getEmbedding(text) {
        const cacheKey = this.hashText(text);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        let embedding;

        if (this.openaiApiKey) {
            try {
                embedding = await this.getOpenAIEmbedding(text);
            } catch (error) {
                console.warn('[Embeddings] OpenAI failed, using fallback:', error.message);
                embedding = this.getSimpleEmbedding(text);
            }
        } else {
            embedding = this.getSimpleEmbedding(text);
        }

        this.cache.set(cacheKey, embedding);
        return embedding;
    }

    /**
     * Get embeddings for multiple texts (batch)
     */
    async getEmbeddings(texts) {
        const embeddings = await Promise.all(
            texts.map(text => this.getEmbedding(text))
        );
        return embeddings;
    }

    /**
     * Calculate cosine similarity between two embeddings
     */
    cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Embedding dimensions must match');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }

    /**
     * Find best matching rubric points for a claim
     * Returns matches with similarity scores
     */
    async matchClaimToRubric(claim, rubricPoints) {
        const claimEmbedding = await this.getEmbedding(claim);

        const matches = await Promise.all(
            rubricPoints.map(async (point) => {
                const pointEmbedding = await this.getEmbedding(point.text);
                const similarity = this.cosineSimilarity(claimEmbedding, pointEmbedding);

                return {
                    pointId: point.id,
                    pointText: point.text,
                    pointType: point.type,
                    similarity,
                    coverage: this.classifyCoverage(similarity),
                };
            })
        );

        return matches.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Classify coverage based on similarity threshold
     */
    classifyCoverage(similarity) {
        if (similarity >= 0.78) return 'covered';
        if (similarity >= 0.70) return 'partial';
        return 'missing';
    }

    /**
     * Get OpenAI embedding
     */
    async getOpenAIEmbedding(text) {
        const response = await fetch(OPENAI_EMBEDDINGS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`,
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: text.substring(0, 8000), // Truncate for safety
                dimensions: EMBEDDING_DIMENSIONS,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenAI Embeddings error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }

    /**
     * Simple fallback embedding using word frequency hashing
     * Not as good as neural embeddings but deterministic and fast
     */
    getSimpleEmbedding(text) {
        const words = this.tokenize(text.toLowerCase());
        const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0);

        // Create a bag-of-words style embedding with position-aware hashing
        words.forEach((word, position) => {
            const hash1 = this.simpleHash(word);
            const hash2 = this.simpleHash(word + '_pos_' + (position % 10));

            // Distribute word influence across embedding dimensions
            for (let i = 0; i < 4; i++) {
                const idx1 = (hash1 + i * 17) % EMBEDDING_DIMENSIONS;
                const idx2 = (hash2 + i * 23) % EMBEDDING_DIMENSIONS;

                embedding[idx1] += 1.0 / (1 + i);
                embedding[idx2] += 0.5 / (1 + i);
            }
        });

        // Normalize the embedding
        return this.normalize(embedding);
    }

    /**
     * Tokenize text into words
     */
    tokenize(text) {
        return text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    /**
     * Simple string hash function
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Quick hash for caching
     */
    hashText(text) {
        return this.simpleHash(text.substring(0, 200)).toString(36);
    }

    /**
     * Normalize vector to unit length
     */
    normalize(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vector;
        return vector.map(val => val / magnitude);
    }

    /**
     * Clear embedding cache
     */
    clearCache() {
        this.cache.clear();
    }
}

const embeddingsService = new EmbeddingsService();

module.exports = { EmbeddingsService, embeddingsService };
