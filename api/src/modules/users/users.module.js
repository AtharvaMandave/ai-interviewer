const { Module } = require('@nestjs/common');
const { UsersService } = require('./users.service');
const { UsersController } = require('./users.controller');

@Module({
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
class UsersModule { }

module.exports = { UsersModule };
