const { Module } = require('@nestjs/common');
const { RubricService } = require('./rubric.service');
const { RubricRepository } = require('./rubric.repository');
const { RubricValidator } = require('./rubric.validator');
const { RubricController } = require('./rubric.controller');

@Module({
    controllers: [RubricController],
    providers: [RubricService, RubricRepository, RubricValidator],
    exports: [RubricService],
})
class RubricModule { }

module.exports = { RubricModule };
