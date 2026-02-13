const { Module } = require('@nestjs/common');
const { QuestionService } = require('./question.service');
const { QuestionRepository } = require('./question.repository');
const { QuestionController } = require('./question.controller');

@Module({
    controllers: [QuestionController],
    providers: [QuestionService, QuestionRepository],
    exports: [QuestionService, QuestionRepository],
})
class QuestionBankModule { }

module.exports = { QuestionBankModule };
