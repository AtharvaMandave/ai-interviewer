const { IsString, IsOptional, MaxLength } = require('class-validator');

class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name;

    @IsOptional()
    @IsString()
    avatar;
}

module.exports = { UpdateUserDto };
