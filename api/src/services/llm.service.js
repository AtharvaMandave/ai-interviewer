/**
 * LLM Service - Manages LLM providers with retry logic and fallback
 * Primary: Groq (fast, cheap)
 * Fallback: Google Gemini
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * LLM Service class
 */
class LLMService {
    constructor() {
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.geminiApiKey = process.env.GEMINI_API_KEY;
        this.primaryProvider = process.env.LLM_PROVIDER || 'groq';
        this.maxRetries = 3;
        this.retryDelayMs = 1000;
    }

    /**
     * Generate completion with automatic fallback
     */
    async generate(prompt, options = {}) {
        const { maxTokens = 2000, temperature = 0.7, systemPrompt } = options;

        // Try primary provider
        try {
            if (this.primaryProvider === 'groq') {
                return await this.callGroq(prompt, { maxTokens, temperature, systemPrompt });
            } else {
                return await this.callGemini(prompt, { maxTokens, temperature, systemPrompt });
            }
        } catch (primaryError) {
            console.warn(`[LLM] Primary provider (${this.primaryProvider}) failed:`, primaryError.message);

            // Try fallback
            const fallbackProvider = this.primaryProvider === 'groq' ? 'gemini' : 'groq';

            try {
                console.log(`[LLM] Trying fallback provider: ${fallbackProvider}`);
                if (fallbackProvider === 'groq') {
                    return await this.callGroq(prompt, { maxTokens, temperature, systemPrompt });
                } else {
                    return await this.callGemini(prompt, { maxTokens, temperature, systemPrompt });
                }
            } catch (fallbackError) {
                console.error(`[LLM] Fallback provider (${fallbackProvider}) also failed:`, fallbackError.message);
                throw new Error(`All LLM providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
            }
        }
    }

    /**
     * Generate JSON response
     */
    async generateJSON(prompt, options = {}) {
        const jsonPrompt = prompt + '\n\nIMPORTANT: Respond with valid JSON only. No markdown, no explanation, no code blocks.';
        const response = await this.generate(jsonPrompt, options);

        try {
            // Try to extract JSON from response
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }

            // Find JSON object or array
            const jsonMatch = jsonStr.match(/[\[{][\s\S]*[\]}]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return JSON.parse(jsonStr);
        } catch (parseError) {
            console.error('[LLM] Failed to parse JSON response:', response.substring(0, 200));
            throw new Error('Invalid JSON response from LLM: ' + parseError.message);
        }
    }

    /**
     * Call Groq API with retry logic
     */
    async callGroq(prompt, options = {}) {
        if (!this.groqApiKey) {
            throw new Error('GROQ_API_KEY not configured');
        }

        const { maxTokens, temperature, systemPrompt, model = DEFAULT_GROQ_MODEL } = options;

        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const body = {
            model,
            messages,
            max_tokens: maxTokens,
            temperature,
        };

        return this.retryRequest(async () => {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqApiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || '';
        });
    }

    /**
     * Call Google Gemini API with retry logic
     */
    async callGemini(prompt, options = {}) {
        if (!this.geminiApiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        const { maxTokens, temperature, systemPrompt, model = DEFAULT_GEMINI_MODEL } = options;

        const url = `${GEMINI_API_URL}/${model}:generateContent?key=${this.geminiApiKey}`;

        const contents = [];
        if (systemPrompt) {
            contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
            contents.push({ role: 'model', parts: [{ text: 'Understood. I will follow these instructions.' }] });
        }
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const body = {
            contents,
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature,
            },
        };

        return this.retryRequest(async () => {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        });
    }

    /**
     * Retry logic with exponential backoff
     */
    async retryRequest(fn) {
        let lastError;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry on auth errors
                if (error.message.includes('401') || error.message.includes('403')) {
                    throw error;
                }

                if (attempt < this.maxRetries) {
                    const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
                    console.log(`[LLM] Retry ${attempt}/${this.maxRetries} after ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Health check
     */
    async healthCheck() {
        const results = { groq: 'unknown', gemini: 'unknown' };

        if (this.groqApiKey) {
            try {
                await this.callGroq('Say "ok"', { maxTokens: 10 });
                results.groq = 'healthy';
            } catch (e) {
                results.groq = `error: ${e.message}`;
            }
        } else {
            results.groq = 'not configured';
        }

        if (this.geminiApiKey) {
            try {
                await this.callGemini('Say "ok"', { maxTokens: 10 });
                results.gemini = 'healthy';
            } catch (e) {
                results.gemini = `error: ${e.message}`;
            }
        } else {
            results.gemini = 'not configured';
        }

        return results;
    }

    /**
     * Generate the next interview question based on context
     */
    async generateNextQuestion(context) {
        const { domain, currentTopic, currentDifficulty, previousScore, previousQuestion, resumeContext, planStage } = context;

        // Determine new difficulty
        let newDifficulty = currentDifficulty;
        if (previousScore !== undefined) {
            if (previousScore > 80 && currentDifficulty === 'Easy') newDifficulty = 'Medium';
            else if (previousScore > 80 && currentDifficulty === 'Medium') newDifficulty = 'Hard';
            else if (previousScore < 40 && currentDifficulty === 'Hard') newDifficulty = 'Medium';
            else if (previousScore < 40 && currentDifficulty === 'Medium') newDifficulty = 'Easy';
        }

        const prompt = `
        You are an expert technical interviewer. Generate a ${newDifficulty} interview question for the domain "${domain}"${currentTopic ? ` and topic "${currentTopic}"` : ''}.
        
        CONTEXT:
        ${resumeContext ? `Candidate Resume Summary: ${JSON.stringify(resumeContext).substring(0, 500)}...` : ''}
        ${planStage ? `Current Interview Stage: ${planStage}` : ''}
        ${previousQuestion ? `Previous Question: "${previousQuestion}" (Score: ${previousScore})` : ''}
        
        INSTRUCTIONS:
        1. Generate a generic but challenging coding or conceptual question.
        2. EXCLUDE specific company names unless relevant.
        3. Create a scoring rubric with "Must Have" (Core), "Good to Have" (Bonus), and "Red Flags".
        4. Provide hints.
        
        RESPOND WITH JSON ONLY:
        {
            "text": "Question text here...",
            "difficulty": "${newDifficulty}",
            "topic": "${currentTopic || 'General'}",
            "subTopic": "Specific concept",
            "tags": ["tag1", "tag2"],
            "hints": ["hint1", "hint2"],
            "rubric": {
                "mustHave": ["point 1", "point 2"],
                "goodToHave": ["bonus point 1"],
                "redFlags": ["major error 1"]
            }
        }
        `;

        return this.generateJSON(prompt, { temperature: 0.7 });
    }

    /**
     * Generate a full interview plan based on resume
     */
    async generateInterviewPlan(resumeAnalysis, position = 'Software Engineer') {
        const prompt = `
        Create a structured technical interview plan for a ${position} role based on this candidate's profile.
        
        CANDIDATE PROFILE:
        ${JSON.stringify(resumeAnalysis)}
        
        REQUIREMENTS:
        1. Create a 5-step interview progression.
        2. Start with an introduction/resume walk-through.
        3. Include 2 technical deep-dives into their strongest areas.
        4. Include 1 system design or problem-solving scenario.
        5. End with a behavioral/culture fit section.
        
        RESPOND WITH JSON ONLY:
        {
            "stages": [
                {
                    "step": 1,
                    "type": "Introduction",
                    "focus": "Resume walkthrough",
                    "suggestedQuestion": "Tell me about yourself..."
                },
                ...
            ]
        }
        `;

        return this.generateJSON(prompt, { temperature: 0.5 });
    }

    /**
     * Generate a hiring report
     */
    async generateHiringReport(sessionData) {
        const prompt = `
        Generate a hiring recommendation report based on this interview session.
        
        SESSION DATA:
        ${JSON.stringify(sessionData).substring(0, 3000)}
        
        RESPOND WITH JSON ONLY:
        {
            "recommendation": "HIRE" | "NO HIRE" | "STRONG HIRE" | "LEAN HIRE",
            "summary": "Executive summary...",
            "strengths": [".."],
            "weaknesses": [".."],
            "rating": 85
        }
        `;

        return this.generateJSON(prompt, { temperature: 0.3 });
    }

}

const llmService = new LLMService();

module.exports = { LLMService, llmService };
