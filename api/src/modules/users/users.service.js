const { Injectable, NotFoundException } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

@Injectable()
class UsersService {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                provider: true,
                createdAt: true,
                lastLogin: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByProvider(provider, providerId) {
        return this.prisma.user.findFirst({
            where: { provider, providerId },
        });
    }

    async create(userData) {
        return this.prisma.user.create({
            data: userData,
        });
    }

    async update(id, updateData) {
        return this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }

    async updateLastLogin(id) {
        return this.prisma.user.update({
            where: { id },
            data: { lastLogin: new Date() },
        });
    }

    async getProfile(id) {
        const user = await this.findById(id);

        // Get user stats
        const [sessionsCount, avgScore] = await Promise.all([
            this.prisma.session.count({ where: { userId: id } }),
            this.prisma.session.aggregate({
                where: { userId: id, status: 'completed' },
                _avg: { totalScore: true },
            }),
        ]);

        return {
            ...user,
            stats: {
                totalSessions: sessionsCount,
                averageScore: avgScore._avg.totalScore || 0,
            },
        };
    }

    async delete(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
}

module.exports = { UsersService };
