const { Injectable, CanActivate, ExecutionContext, ForbiddenException } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');

const ROLES_KEY = 'roles';

/**
 * Roles decorator
 */
const Roles = (...roles) => {
    return (target, key, descriptor) => {
        Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value);
        return descriptor;
    };
};

/**
 * Guard to check user roles
 */
@Injectable()
class RolesGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }

    canActivate(context) {
        const requiredRoles = this.reflector.get(ROLES_KEY, context.getHandler());

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('No user found');
        }

        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}

module.exports = { RolesGuard, Roles, ROLES_KEY };
