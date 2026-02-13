const { Injectable } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');

@Injectable()
class AppConfigService {
    constructor(configService) {
        this.configService = configService;
    }

    get nodeEnv() {
        return this.configService.get('NODE_ENV');
    }

    get port() {
        return this.configService.get('PORT');
    }

    get isDevelopment() {
        return this.nodeEnv === 'development';
    }

    get isProduction() {
        return this.nodeEnv === 'production';
    }

    // Database
    get databaseUrl() {
        return this.configService.get('DATABASE_URL');
    }

    // Redis
    get redis() {
        return {
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get('REDIS_PORT'),
            password: this.configService.get('REDIS_PASSWORD') || undefined,
        };
    }

    // JWT
    get jwt() {
        return {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN'),
        };
    }

    // OAuth
    get google() {
        return {
            clientId: this.configService.get('GOOGLE_CLIENT_ID'),
            clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
            callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL'),
        };
    }

    get github() {
        return {
            clientId: this.configService.get('GITHUB_CLIENT_ID'),
            clientSecret: this.configService.get('GITHUB_CLIENT_SECRET'),
            callbackUrl: this.configService.get('GITHUB_CALLBACK_URL'),
        };
    }

    // LLM
    get llm() {
        return {
            provider: this.configService.get('LLM_PROVIDER'),
            groqApiKey: this.configService.get('GROQ_API_KEY'),
            geminiApiKey: this.configService.get('GEMINI_API_KEY'),
            openaiApiKey: this.configService.get('OPENAI_API_KEY'),
        };
    }

    // Vector DB
    get pinecone() {
        return {
            apiKey: this.configService.get('PINECONE_API_KEY'),
            index: this.configService.get('PINECONE_INDEX'),
        };
    }

    // Session settings
    get session() {
        return {
            ttlSeconds: 1800, // 30 minutes
            maxQuestions: 10,
            maxFollowUpDepth: 3,
        };
    }
}

// Manual dependency injection for JavaScript
AppConfigService.prototype.injectDependencies = function (configService) {
    this.configService = configService;
};

module.exports = { AppConfigService };
