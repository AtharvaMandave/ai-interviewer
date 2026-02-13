const { IsString, IsUUID, IsInt, IsOptional, Min, MaxLength } = require('class-validator');

class SubmitAnswerDto {
    @IsString()
    @IsUUID()
    sessionId;

    @IsString()
    @IsUUID()
    questionId;

    @IsString()
    @MaxLength(10000)
    answer;

    @IsOptional()
    @IsInt()
    @Min(0)
    responseTimeMs;
}

module.exports = { SubmitAnswerDto };
