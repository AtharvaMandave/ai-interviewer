require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

async function test() {
    try {
        // Prisma 7 with pg adapter
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        await prisma.$connect();
        console.log('✅ Connected to database!');

        const count = await prisma.question.count();
        console.log('Current question count:', count);

        await prisma.$disconnect();
        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

test();
