const { Module } = require('@nestjs/common');
const { EvaluationService } = require('./evaluation.service');
const { ScoringFormula } = require('./scoring.formula');
const { SemanticMatcher } = require('./semantic.matcher');
const { LLMModule } = require('../llm/llm.module');
const { RubricModule } = require('../rubric/rubric.module');

@Module({
    imports: [LLMModule, RubricModule],
    providers: [EvaluationService, ScoringFormula, SemanticMatcher],
    exports: [EvaluationService],
})
class EvaluationModule { }

module.exports = { EvaluationModule };
