const { Injectable } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');

/**
 * OpenAI LLM Provider
 */
@Injectable()
class OpenAIProvider {
    constructor(configService) {
        this.apiKey = configService.get('OPENAI_API_KEY');
        this.baseUrl = 'https://api.openai.com/v1';
        this.defaultModel = 'gpt-4o-mini';
        this.embeddingModel = 'text-embedding-3-small';
    }

    async generate(prompt, options = {}) {
        const { maxTokens = 1000, temperature = 0.7, model } = options;

        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model || this.defaultModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generateEmbedding(text) {
        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const response = await fetch(`${this.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.embeddingModel,
                input: text,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI Embedding error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }
}

module.exports = { OpenAIProvider };
