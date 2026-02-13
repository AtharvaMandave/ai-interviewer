/**
 * Database Seed Script
 * Seeds initial question bank with questions for all domains
 * 
 * Usage: npm run prisma:seed
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { dsaQuestions } = require('./dsa.questions');
const { javaQuestions } = require('./java.questions');
const { dbmsQuestions } = require('./dbms.questions');
const { osQuestions } = require('./os.questions');
const { hrQuestions } = require('./hr.questions');

// Prisma 7 requires adapter for database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...\n');

    // Combine all questions
    const allQuestions = [
        ...dsaQuestions,
        ...javaQuestions,
        ...dbmsQuestions,
        ...osQuestions,
        ...hrQuestions,
    ];

    console.log(`📚 Total questions to seed: ${allQuestions.length}`);
    console.log(`   - DSA: ${dsaQuestions.length}`);
    console.log(`   - Java: ${javaQuestions.length}`);
    console.log(`   - DBMS: ${dbmsQuestions.length}`);
    console.log(`   - OS: ${osQuestions.length}`);
    console.log(`   - HR: ${hrQuestions.length}\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const q of allQuestions) {
        try {
            // Check if similar question exists
            const existing = await prisma.question.findFirst({
                where: {
                    domain: q.domain,
                    topic: q.topic,
                    text: { contains: q.text.substring(0, 50) },
                },
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Create question with rubric
            const { rubric, ...questionData } = q;

            await prisma.question.create({
                data: {
                    ...questionData,
                    rubric: rubric ? {
                        create: {
                            mustHave: rubric.mustHave || [],
                            goodToHave: rubric.goodToHave || [],
                            redFlags: rubric.redFlags || [],
                            keywords: extractKeywords(rubric),
                        },
                    } : undefined,
                },
            });

            created++;
            process.stdout.write(`\r   Creating questions: ${created}/${allQuestions.length}`);
        } catch (error) {
            errors++;
            console.error(`\n❌ Error creating question: ${q.text.substring(0, 40)}...`);
            console.error(`   ${error.message}`);
        }
    }

    console.log(`\n\n✅ Seed completed!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);

    // Print stats
    const stats = await getStats();
    console.log('\n📊 Database Statistics:');
    for (const [domain, count] of Object.entries(stats)) {
        console.log(`   ${domain}: ${count} questions`);
    }
}

function extractKeywords(rubric) {
    const allItems = [
        ...(rubric.mustHave || []),
        ...(rubric.goodToHave || []),
    ];

    const keywords = new Set();
    for (const item of allItems) {
        const words = item.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (word.length > 3 && !stopWords.includes(word)) {
                keywords.add(word);
            }
        }
    }

    return Array.from(keywords).slice(0, 20);
}

const stopWords = [
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has',
    'are', 'were', 'been', 'being', 'can', 'could', 'would', 'should',
    'will', 'when', 'where', 'which', 'while', 'what', 'than', 'then',
    'only', 'also', 'more', 'most', 'some', 'such', 'very', 'just',
];

async function getStats() {
    const domains = await prisma.question.groupBy({
        by: ['domain'],
        _count: true,
        where: { isActive: true },
    });

    return domains.reduce((acc, d) => {
        acc[d.domain] = d._count;
        return acc;
    }, {});
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
