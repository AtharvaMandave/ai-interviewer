const { Injectable, Inject, Optional } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const { GroqProvider } = require('./providers/groq.provider');
const { OpenAIProvider } = require('./providers/openai.provider');
const { retryWithBackoff } = require('../../common/utils/sleep');

/**
 * LLM Service - Manages LLM providers with fallback
 */
class LLMService {
    constructor(configService, groqProvider, openaiProvider) {
        this.config = configService;
        this.providers = {
            groq: groqProvider,
            openai: openaiProvider,
        };
        this.primaryProvider = configService?.get('LLM_PROVIDER') || 'groq';
    }

    /**
     * Generate completion with fallback
     */
    async generate(prompt, options = {}) {
        const { maxTokens = 1000, temperature = 0.7, model } = options;

        // Try primary provider first
        try {
            return await retryWithBackoff(
                () => this.providers[this.primaryProvider].generate(prompt, { maxTokens, temperature, model }),
                2,
                1000,
            );
        } catch (primaryError) {
            console.error(`Primary LLM (${this.primaryProvider}) failed:`, primaryError.message);

            // Try fallback
            const fallbackProvider = this.primaryProvider === 'groq' ? 'openai' : 'groq';
            try {
                return await this.providers[fallbackProvider].generate(prompt, { maxTokens, temperature });
            } catch (fallbackError) {
                console.error(`Fallback LLM (${fallbackProvider}) failed:`, fallbackError.message);
                throw new Error('All LLM providers failed');
            }
        }
    }

    /**
     * Generate JSON response
     */
    async generateJSON(prompt, options = {}) {
        const response = await this.generate(
            prompt + '\n\nRespond with valid JSON only, no markdown or explanation.',
            options,
        );

        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (e) {
            console.error('Failed to parse LLM JSON response:', response);
            throw new Error('Invalid JSON response from LLM');
        }
    }

    /**
     * Generate embeddings
     */
    async generateEmbedding(text) {
        // Use OpenAI for embeddings (more reliable)
        return this.providers.openai.generateEmbedding(text);
    }

    /**
     * Check provider availability
     */
    async healthCheck() {
        const results = {};

        for (const [name, provider] of Object.entries(this.providers)) {
            try {
                await provider.generate('Hello', { maxTokens: 10 });
                results[name] = 'healthy';
            } catch {
                results[name] = 'unavailable';
            }
        }

        return results;
    }
}

// Apply decorator manually
Reflect.decorate([Injectable()], LLMService);

// Set up dependency injection
Reflect.defineMetadata('design:paramtypes', [ConfigService, GroqProvider, OpenAIProvider], LLMService);

module.exports = { LLMService };
