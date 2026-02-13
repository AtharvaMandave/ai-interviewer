const { IsString, IsOptional, IsArray, IsEnum, MaxLength } = require('class-validator');

class UpdateQuestionDto {
    @IsOptional()
    @IsString()
    @IsEnum(['DSA', 'Java', 'DBMS', 'OS', 'HR', 'React', 'C', 'CPP', 'Python'])
    domain;

    @IsOptional()
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
    difficulty;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    text;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    hints;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    companyTags;

    @IsOptional()
    rubric;
}

module.exports = { UpdateQuestionDto };
