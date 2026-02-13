const { IsString, IsEnum, IsOptional, IsInt, Min, Max } = require('class-validator');
const { Domain, Difficulty, SessionMode } = require('../../../common/types/enums');

class StartSessionDto {
    @IsString()
    @IsEnum(Object.values(Domain))
    domain;

    @IsOptional()
    @IsString()
    @IsEnum(Object.values(SessionMode))
    mode = 'Practice';

    @IsOptional()
    @IsString()
    @IsEnum(Object.values(Difficulty))
    difficulty = 'Medium';

    @IsOptional()
    @IsString()
    companyMode; // TCS, Amazon, etc.

    @IsOptional()
    @IsInt()
    @Min(60)
    @Max(3600)
    timeLimit; // seconds (for timed mode)
}

module.exports = { StartSessionDto };
