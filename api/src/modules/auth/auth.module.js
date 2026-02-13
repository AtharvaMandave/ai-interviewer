const { Module } = require('@nestjs/common');
const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');
const { UsersModule } = require('../users/users.module');

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
class AuthModule { }

module.exports = { AuthModule };
