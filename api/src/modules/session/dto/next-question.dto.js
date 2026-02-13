const { IsString, IsUUID } = require('class-validator');

class NextQuestionDto {
    @IsString()
    @IsUUID()
    sessionId;
}

module.exports = { NextQuestionDto };
