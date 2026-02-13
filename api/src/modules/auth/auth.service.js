const { Injectable } = require('@nestjs/common');
const { UsersService } = require('../users/users.service');

/**
 * Auth Service - Placeholder for Phase 8
 * Will implement OAuth with Google/GitHub
 */
@Injectable()
class AuthService {
    constructor(usersService) {
        this.usersService = usersService;
    }

    async validateOAuthUser(profile, provider) {
        // Check if user exists
        let user = await this.usersService.findByProvider(provider, profile.id);

        if (!user) {
            // Create new user
            user = await this.usersService.create({
                email: profile.email,
                name: profile.displayName || profile.name,
                avatar: profile.picture || profile.avatar_url,
                provider,
                providerId: profile.id,
            });
        } else {
            // Update last login
            await this.usersService.updateLastLogin(user.id);
        }

        return user;
    }

    generateToken(user) {
        // Placeholder - will use JWT in Phase 8
        return {
            accessToken: `placeholder-token-${user.id}`,
            expiresIn: '7d',
        };
    }
}

module.exports = { AuthService };
