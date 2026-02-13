const { IsString, IsEnum, IsOptional, IsArray, IsBoolean, MaxLength } = require('class-validator');

class CreateQuestionDto {
    @IsString()
    @IsEnum(['DSA', 'Java', 'DBMS', 'OS', 'HR', 'React', 'C', 'CPP', 'Python'])
    domain;

    @IsString()
    @MaxLength(100)
    topic;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    subTopic;

    @IsOptional()
    @IsString()
    @IsEnum(['Easy', 'Medium', 'Hard'])
    difficulty = 'Medium';

    @IsString()
    @MaxLength(5000)
    text;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags = [];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hints = [];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    companyTags = [];

    @IsOptional()
    rubric;
}

module.exports = { CreateQuestionDto };
