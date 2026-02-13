const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../db/prisma');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

class AuthService {
    /**
     * Register a new user
     */
    async register(email, password, name) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                provider: 'local',
            },
        });

        // Generate token
        const token = this.generateToken(user);

        return { user: this.sanitizeUser(user), token };
    }

    /**
     * Login user
     */
    async login(email, password) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = this.generateToken(user);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        return { user: this.sanitizeUser(user), token };
    }

    /**
     * Get current user profile
     */
    async getMe(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        return this.sanitizeUser(user);
    }

    /**
     * Handle OAuth login/register
     */
    async validateOAuthUser(profile, provider) {
        const email = profile.emails[0].value;

        // 1. Check if user exists with provider
        let user = await prisma.user.findFirst({
            where: {
                provider,
                providerId: profile.id,
            },
        });

        if (user) {
            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });
            return { user: this.sanitizeUser(user), token: this.generateToken(user) };
        }

        // 2. Check if user exists with email (link account)
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Update user with provider info
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    provider,
                    providerId: profile.id,
                    avatar: profile.photos[0]?.value || user.avatar,
                    lastLogin: new Date(),
                },
            });
            return { user: this.sanitizeUser(user), token: this.generateToken(user) };
        }

        // 3. Create new user
        user = await prisma.user.create({
            data: {
                email,
                name: profile.displayName,
                avatar: profile.photos[0]?.value,
                provider,
                providerId: profile.id,
                role: 'user',
            },
        });

        return { user: this.sanitizeUser(user), token: this.generateToken(user) };
    }

    /**
     * Generate JWT token
     */
    generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    /**
     * Remove sensitive data from user object
     */
    sanitizeUser(user) {
        const { passwordHash, ...rest } = user;
        return rest;
    }
}

module.exports = new AuthService();
