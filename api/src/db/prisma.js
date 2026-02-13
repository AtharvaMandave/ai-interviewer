const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Prisma client with adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test connection on startup
prisma.$connect()
    .then(() => console.log('✅ Database connected'))
    .catch((err) => console.error('❌ Database connection failed:', err.message));

// Cleanup on exit
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
});

module.exports = { prisma, pool };
