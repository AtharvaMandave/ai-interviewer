/**
 * Embeddings Service
 * 
 * Handles text embeddings for semantic matching.
 * Supports: Gemini embeddings, OpenAI embeddings, or keyword-based fallback.
 * 
 * When no embedding API is available, uses keyword overlap matching
 * that produces meaningful similarity scores.
 */

const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

const GEMINI_EMBEDDINGS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

const EMBEDDING_DIMENSIONS = 256;

// Common stop words to ignore in keyword matching
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but',
    'and', 'or', 'if', 'while', 'about', 'up', 'out', 'off', 'over',
    'that', 'this', 'these', 'those', 'what', 'which', 'who', 'whom',
    'its', 'his', 'her', 'their', 'our', 'your', 'my', 'also', 'it',
]);

class EmbeddingsService {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        this.geminiApiKey = process.env.GEMINI_API_KEY;
        this.cache = new Map();
        this.provider = this.openaiApiKey ? 'openai' : (this.geminiApiKey ? 'gemini' : 'keyword');
        console.log(`[Embeddings] Using provider: ${this.provider}`);
    }

    /**
     * Get embedding for a text
     * Tries: OpenAI → Gemini → Keyword fallback
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
                console.warn('[Embeddings] OpenAI failed, trying Gemini:', error.message);
                if (this.geminiApiKey) {
                    try {
                        embedding = await this.getGeminiEmbedding(text);
                    } catch (geminiError) {
                        console.warn('[Embeddings] Gemini also failed, using keyword fallback:', geminiError.message);
                        embedding = this.getKeywordEmbedding(text);
                    }
                } else {
                    embedding = this.getKeywordEmbedding(text);
                }
            }
        } else if (this.geminiApiKey) {
            try {
                embedding = await this.getGeminiEmbedding(text);
            } catch (error) {
                console.warn('[Embeddings] Gemini failed, using keyword fallback:', error.message);
                embedding = this.getKeywordEmbedding(text);
            }
        } else {
            embedding = this.getKeywordEmbedding(text);
        }

        this.cache.set(cacheKey, embedding);
        return embedding;
    }

    /**
     * Get embeddings for multiple texts (batch)
     */
    async getEmbeddings(texts) {
        return Promise.all(texts.map(text => this.getEmbedding(text)));
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
     * When no embedding API is available, uses keyword overlap matching
     */
    async matchClaimToRubric(claim, rubricPoints) {
        // Use keyword overlap when no API key is available (much more accurate than hash embeddings)
        if (!this.openaiApiKey && !this.geminiApiKey) {
            return this.keywordMatchClaimToRubric(claim, rubricPoints);
        }

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
     * Keyword-based matching - uses TF-IDF-like word overlap scoring
     * This is much more accurate than hash-based embeddings for short texts
     */
    keywordMatchClaimToRubric(claim, rubricPoints) {
        const claimTokens = this.extractKeywords(claim);

        const matches = rubricPoints.map((point) => {
            const pointTokens = this.extractKeywords(point.text);
            const similarity = this.keywordSimilarity(claimTokens, pointTokens);

            return {
                pointId: point.id,
                pointText: point.text,
                pointType: point.type,
                similarity,
                coverage: this.classifyCoverageKeyword(similarity),
            };
        });

        return matches.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Extract meaningful keywords from text, removing stop words and normalizing
     */
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !STOP_WORDS.has(w));

        // Also generate bigrams for better phrase matching
        const bigrams = [];
        for (let i = 0; i < words.length - 1; i++) {
            bigrams.push(words[i] + '_' + words[i + 1]);
        }

        return { words: new Set(words), bigrams: new Set(bigrams) };
    }

    /**
     * Calculate keyword-based similarity score between two token sets
     * Uses Jaccard-like coefficient with bigram bonus
     */
    keywordSimilarity(tokensA, tokensB) {
        if (tokensB.words.size === 0) return 0;

        // Word overlap (main signal)
        let wordMatches = 0;
        for (const word of tokensB.words) {
            if (tokensA.words.has(word)) {
                wordMatches++;
            }
        }

        // Bigram overlap (bonus for phrase matching)
        let bigramMatches = 0;
        for (const bigram of tokensB.bigrams) {
            if (tokensA.bigrams.has(bigram)) {
                bigramMatches++;
            }
        }

        // Calculate score: word recall against the rubric point's keywords
        const wordRecall = wordMatches / tokensB.words.size;
        const bigramBonus = tokensB.bigrams.size > 0
            ? (bigramMatches / tokensB.bigrams.size) * 0.15
            : 0;

        // Also consider coverage of the claim (precision-like)
        const wordPrecision = tokensA.words.size > 0
            ? wordMatches / Math.min(tokensA.words.size, tokensB.words.size * 3)
            : 0;

        // Combined score: weighted harmonic mean of recall and precision, plus bigram bonus
        const combinedWord = wordRecall > 0 && wordPrecision > 0
            ? (2 * wordRecall * wordPrecision) / (wordRecall + wordPrecision)
            : Math.max(wordRecall * 0.8, wordPrecision * 0.5);

        return Math.min(1.0, combinedWord + bigramBonus);
    }

    /**
     * Coverage classification for keyword matching
     * Uses lower thresholds than embedding-based matching since keyword overlap
     * naturally produces lower but more meaningful scores
     */
    classifyCoverageKeyword(similarity) {
        if (similarity >= 0.40) return 'covered';
        if (similarity >= 0.25) return 'partial';
        return 'missing';
    }

    /**
     * Coverage classification for embedding-based matching
     */
    classifyCoverage(similarity) {
        if (similarity >= 0.78) return 'covered';
        if (similarity >= 0.70) return 'partial';
        return 'missing';
    }

    // ============= EMBEDDING PROVIDERS =============

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
                model: OPENAI_EMBEDDING_MODEL,
                input: text.substring(0, 8000),
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
     * Get Gemini embedding using text-embedding-004 model
     */
    async getGeminiEmbedding(text) {
        const url = `${GEMINI_EMBEDDINGS_URL}?key=${this.geminiApiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: {
                    parts: [{ text: text.substring(0, 8000) }],
                },
                outputDimensionality: EMBEDDING_DIMENSIONS,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Gemini Embeddings error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.embedding.values;
    }

    /**
     * Keyword-based embedding fallback using improved TF-IDF hashing
     * Only used when an embedding API is available but a specific call fails
     */
    getKeywordEmbedding(text) {
        const words = this.tokenize(text.toLowerCase());
        const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0);

        words.forEach((word, position) => {
            const hash1 = this.simpleHash(word);
            const hash2 = this.simpleHash(word + '_pos_' + (position % 10));

            for (let i = 0; i < 4; i++) {
                const idx1 = (hash1 + i * 17) % EMBEDDING_DIMENSIONS;
                const idx2 = (hash2 + i * 23) % EMBEDDING_DIMENSIONS;

                embedding[idx1] += 1.0 / (1 + i);
                embedding[idx2] += 0.5 / (1 + i);
            }
        });

        return this.normalize(embedding);
    }

    // ============= UTILITIES =============

    tokenize(text) {
        return text
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    hashText(text) {
        return this.simpleHash(text.substring(0, 200)).toString(36);
    }

    normalize(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (magnitude === 0) return vector;
        return vector.map(val => val / magnitude);
    }

    clearCache() {
        this.cache.clear();
    }
}

const embeddingsService = new EmbeddingsService();

module.exports = { EmbeddingsService, embeddingsService };
