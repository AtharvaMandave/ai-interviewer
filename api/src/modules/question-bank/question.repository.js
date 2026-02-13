const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

@Injectable()
class QuestionRepository {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    async create(data) {
        return this.prisma.question.create({
            data,
            include: { rubric: true },
        });
    }

    async findById(id) {
        return this.prisma.question.findUnique({
            where: { id },
            include: { rubric: true },
        });
    }

    async findMany(filters = {}) {
        const { domain, difficulty, topic, isActive = true, skip, take } = filters;

        return this.prisma.question.findMany({
            where: {
                ...(domain && { domain }),
                ...(difficulty && { difficulty }),
                ...(topic && { topic: { contains: topic } }),
                isActive,
            },
            include: { rubric: true },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    }

    async count(filters = {}) {
        const { domain, difficulty, topic, isActive = true, excludeIds = [] } = filters;

        return this.prisma.question.count({
            where: {
                ...(domain && { domain }),
                ...(difficulty && { difficulty }),
                ...(topic && { topic }),
                isActive,
                id: { notIn: excludeIds },
            },
        });
    }

    async findRandom(criteria = {}) {
        const { domain, difficulty, topic, excludeIds = [] } = criteria;

        const count = await this.count({ domain, difficulty, topic, excludeIds });
        if (count === 0) return null;

        const randomOffset = Math.floor(Math.random() * count);

        const questions = await this.prisma.question.findMany({
            where: {
                ...(domain && { domain }),
                ...(difficulty && { difficulty }),
                ...(topic && { topic }),
                isActive: true,
                id: { notIn: excludeIds },
            },
            include: { rubric: true },
            skip: randomOffset,
            take: 1,
        });

        return questions[0] || null;
    }

    async findByTopic(domain, topic, difficulty = null) {
        return this.prisma.question.findMany({
            where: {
                domain,
                topic,
                ...(difficulty && { difficulty }),
                isActive: true,
            },
            include: { rubric: true },
        });
    }

    async update(id, data) {
        return this.prisma.question.update({
            where: { id },
            data,
            include: { rubric: true },
        });
    }

    async softDelete(id) {
        return this.prisma.question.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async getStats() {
        const stats = await this.prisma.question.groupBy({
            by: ['domain', 'difficulty'],
            _count: true,
            where: { isActive: true },
        });

        return stats.reduce((acc, item) => {
            if (!acc[item.domain]) {
                acc[item.domain] = { total: 0, Easy: 0, Medium: 0, Hard: 0 };
            }
            acc[item.domain][item.difficulty] = item._count;
            acc[item.domain].total += item._count;
            return acc;
        }, {});
    }

    async getTopics(domain) {
        const topics = await this.prisma.question.findMany({
            where: { domain, isActive: true },
            select: { topic: true },
            distinct: ['topic'],
        });
        return topics.map((t) => t.topic);
    }
}

module.exports = { QuestionRepository };
