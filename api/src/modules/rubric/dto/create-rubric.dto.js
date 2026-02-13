const { IsArray, IsOptional, IsString, ArrayMinSize, ArrayMaxSize } = require('class-validator');

class CreateRubricDto {
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(3)
    @ArrayMaxSize(8)
    mustHave;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(6)
    goodToHave = [];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @ArrayMaxSize(8)
    redFlags = [];

    @IsOptional()
    @IsString()
    idealAnswer;
}

module.exports = { CreateRubricDto };
