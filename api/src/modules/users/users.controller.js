const { Controller, Get, Put, Delete, UseGuards } = require('@nestjs/common');
const { UsersService } = require('./users.service');
const { OAuthGuard } = require('../../common/guards/oauth.guard');

/**
 * Users Controller
 * Handles user profile operations
 */
class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }

    /**
     * Get current user profile
     * GET /users/me
     */
    async getProfile(req, res) {
        return this.usersService.getProfile(req.user?.id);
    }

    /**
     * Update current user
     * PUT /users/me
     */
    async updateProfile(req, res) {
        const { name, avatar } = req.body;
        return this.usersService.update(req.user?.id, { name, avatar });
    }

    /**
     * Get user by ID (admin)
     * GET /users/:id
     */
    async getUser(req, res) {
        return this.usersService.findById(req.params.id);
    }

    /**
     * Delete account
     * DELETE /users/me
     */
    async deleteAccount(req, res) {
        await this.usersService.delete(req.user?.id);
        return { message: 'Account deleted successfully' };
    }
}

// Apply decorators manually
Reflect.decorate([Controller('users')], UsersController);

const decorateMethod = (decorators, methodName) => {
    const desc = Object.getOwnPropertyDescriptor(UsersController.prototype, methodName);
    for (const decorator of decorators) {
        Reflect.decorate([decorator], UsersController.prototype, methodName, desc);
    }
};

decorateMethod([Get('me'), UseGuards(OAuthGuard)], 'getProfile');
decorateMethod([Put('me'), UseGuards(OAuthGuard)], 'updateProfile');
decorateMethod([Get(':id')], 'getUser');
decorateMethod([Delete('me'), UseGuards(OAuthGuard)], 'deleteAccount');

Reflect.defineMetadata('design:paramtypes', [UsersService], UsersController);

module.exports = { UsersController };
