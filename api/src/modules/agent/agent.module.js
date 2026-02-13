const { Module } = require('@nestjs/common');
const { OrchestratorService } = require('./orchestrator.service');
const { PolicyEngine } = require('./policy.engine');
const { InterviewerService } = require('./interviewer.service');
const { EvaluatorService } = require('./evaluator.service');
const { AnalystService } = require('./analyst.service');
const { QuestionBankModule } = require('../question-bank/question-bank.module');
const { RubricModule } = require('../rubric/rubric.module');

@Module({
    imports: [QuestionBankModule, RubricModule],
    providers: [
        OrchestratorService,
        PolicyEngine,
        InterviewerService,
        EvaluatorService,
        AnalystService,
    ],
    exports: [OrchestratorService, EvaluatorService, AnalystService],
})
class AgentModule { }

module.exports = { AgentModule };
