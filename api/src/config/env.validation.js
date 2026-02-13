const Joi = require('joi');

const envValidationSchema = Joi.object({
    // Server
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3001),

    // Database
    DATABASE_URL: Joi.string().required(),

    // Redis
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),

    // OAuth
    GOOGLE_CLIENT_ID: Joi.string().optional(),
    GOOGLE_CLIENT_SECRET: Joi.string().optional(),
    GOOGLE_CALLBACK_URL: Joi.string().optional(),
    GITHUB_CLIENT_ID: Joi.string().optional(),
    GITHUB_CLIENT_SECRET: Joi.string().optional(),
    GITHUB_CALLBACK_URL: Joi.string().optional(),

    // LLM Providers
    GROQ_API_KEY: Joi.string().optional(),
    GEMINI_API_KEY: Joi.string().optional(),
    OPENAI_API_KEY: Joi.string().optional(),
    LLM_PROVIDER: Joi.string().valid('groq', 'gemini', 'openai').default('groq'),

    // Vector DB
    PINECONE_API_KEY: Joi.string().optional(),
    PINECONE_INDEX: Joi.string().optional(),
});

module.exports = { envValidationSchema };
