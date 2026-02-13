const { Module } = require('@nestjs/common');
const { LLMService } = require('./llm.service');
const { GroqProvider } = require('./providers/groq.provider');
const { OpenAIProvider } = require('./providers/openai.provider');

@Module({
    providers: [LLMService, GroqProvider, OpenAIProvider],
    exports: [LLMService],
})
class LLMModule { }

module.exports = { LLMModule };
