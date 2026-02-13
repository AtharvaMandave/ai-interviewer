const { Injectable } = require('@nestjs/common');
const { PrismaService } = require('../../prisma/prisma.service');

@Injectable()
class RubricRepository {
    constructor(prismaService) {
        this.prisma = prismaService;
    }

    async findByQuestionId(questionId) {
        return this.prisma.rubric.findUnique({
            where: { questionId },
        });
    }

    async create(data) {
        return this.prisma.rubric.create({ data });
    }

    async update(questionId, data) {
        return this.prisma.rubric.update({
            where: { questionId },
            data,
        });
    }

    async upsert(questionId, data) {
        return this.prisma.rubric.upsert({
            where: { questionId },
            update: data,
            create: { questionId, ...data },
        });
    }

    async delete(questionId) {
        return this.prisma.rubric.delete({
            where: { questionId },
        });
    }
}

module.exports = { RubricRepository };
