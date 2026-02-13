const { Module } = require('@nestjs/common');
const { SessionController } = require('./session.controller');
const { SessionService } = require('./session.service');
const { QuestionBankModule } = require('../question-bank/question-bank.module');

@Module({
    imports: [QuestionBankModule],
    controllers: [SessionController],
    providers: [SessionService],
    exports: [SessionService],
})
class SessionModule { }

module.exports = { SessionModule };
