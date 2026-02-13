const { Controller, Get, Post, Req, Inject } = require('@nestjs/common');

/**
 * Auth Controller - Placeholder for Phase 8
 * Will implement OAuth endpoints
 */
class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async status(req) {
        return {
            authenticated: !!req.user,
            user: req.user || null,
        };
    }

    // OAuth endpoints will be added in Phase 8
    // google() {}
    // googleCallback() {}
    // github() {}
    // githubCallback() {}
    // logout() {}
}

// Apply decorators manually for compatibility
const controllerDecorator = Controller('auth');
const getStatusDecorator = Get('status');

// Decorate the class
Reflect.decorate([controllerDecorator], AuthController);

// Decorate methods
Reflect.decorate(
    [getStatusDecorator],
    AuthController.prototype,
    'status',
    Object.getOwnPropertyDescriptor(AuthController.prototype, 'status')
);

// Inject dependencies
Reflect.defineMetadata('design:paramtypes', [require('./auth.service').AuthService], AuthController);

module.exports = { AuthController };
