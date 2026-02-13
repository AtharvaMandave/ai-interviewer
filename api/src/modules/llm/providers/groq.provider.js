const { Injectable } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');

/**
 * Groq LLM Provider
 */
@Injectable()
class GroqProvider {
    constructor(configService) {
        this.apiKey = configService.get('GROQ_API_KEY');
        this.baseUrl = 'https://api.groq.com/openai/v1';
        this.defaultModel = 'llama-3.1-70b-versatile';
    }

    async generate(prompt, options = {}) {
        const { maxTokens = 1000, temperature = 0.7, model } = options;

        if (!this.apiKey) {
            throw new Error('GROQ_API_KEY not configured');
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
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generateEmbedding(text) {
        // Groq doesn't support embeddings, throw to use fallback
        throw new Error('Groq does not support embeddings');
    }
}

module.exports = { GroqProvider };
