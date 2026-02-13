const { Injectable, CanActivate, ExecutionContext, UnauthorizedException } = require('@nestjs/common');

/**
 * Guard to verify OAuth authentication
 */
@Injectable()
class OAuthGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        return true;
    }
}

module.exports = { OAuthGuard };
