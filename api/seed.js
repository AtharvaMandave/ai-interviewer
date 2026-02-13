const { prisma } = require('./src/db/prisma');

async function seed() {
    console.log('Seeding database...');

    // Create sample questions
    const questions = [
        {
            text: 'Explain how HashMap works in Java. What is the time complexity of get and put operations?',
            domain: 'Java',
            topic: 'Collections',
            difficulty: 'Medium',
            isActive: true,
            tags: ['collections', 'hashing', 'data-structures'],
            hints: ['Think about how hashing works', 'Consider collision resolution'],
            companyTags: ['Amazon', 'Google', 'Microsoft'],
        },
        {
            text: 'What is the difference between ArrayList and LinkedList? When would you use each?',
            domain: 'Java',
            topic: 'Collections',
            difficulty: 'Easy',
            isActive: true,
            tags: ['collections', 'lists', 'data-structures'],
            hints: ['Consider memory layout', 'Think about access patterns'],
            companyTags: ['Amazon', 'Flipkart'],
        },
        {
            text: 'Explain the concept of garbage collection in Java. What are the different types of garbage collectors?',
            domain: 'Java',
            topic: 'Memory Management',
            difficulty: 'Hard',
            isActive: true,
            tags: ['memory', 'jvm', 'gc'],
            hints: ['Think about heap generations', 'Consider GC algorithms'],
            companyTags: ['Oracle', 'Google'],
        },
        {
            text: 'What is multithreading in Java? Explain Thread vs Runnable.',
            domain: 'Java',
            topic: 'Concurrency',
            difficulty: 'Medium',
            isActive: true,
            tags: ['threads', 'concurrency'],
            hints: ['Consider inheritance vs interface', 'Think about reusability'],
            companyTags: ['Amazon', 'Goldman Sachs'],
        },
        {
            text: 'What is the time complexity of binary search? Explain the algorithm.',
            domain: 'DSA',
            topic: 'Searching',
            difficulty: 'Easy',
            isActive: true,
            tags: ['searching', 'algorithms', 'divide-conquer'],
            hints: ['Array must be sorted', 'Think about halving'],
            companyTags: ['Google', 'Microsoft'],
        },
        {
            text: 'Explain how a balanced binary search tree maintains balance. Compare AVL and Red-Black trees.',
            domain: 'DSA',
            topic: 'Trees',
            difficulty: 'Hard',
            isActive: true,
            tags: ['trees', 'balancing', 'data-structures'],
            hints: ['Think about rotation operations', 'Consider height balance'],
            companyTags: ['Google', 'Meta'],
        },
        {
            text: 'What is dynamic programming? Explain with an example.',
            domain: 'DSA',
            topic: 'Dynamic Programming',
            difficulty: 'Medium',
            isActive: true,
            tags: ['dp', 'optimization', 'algorithms'],
            hints: ['Think about overlapping subproblems', 'Consider memoization'],
            companyTags: ['Amazon', 'Google', 'Microsoft'],
        },
        {
            text: 'Explain the difference between BFS and DFS. When would you use each?',
            domain: 'DSA',
            topic: 'Graph Algorithms',
            difficulty: 'Medium',
            isActive: true,
            tags: ['graphs', 'traversal', 'algorithms'],
            hints: ['Think about queues vs stacks', 'Consider shortest path'],
            companyTags: ['Meta', 'Amazon'],
        },
        {
            text: 'What is ACID in databases? Explain each property.',
            domain: 'DBMS',
            topic: 'Transactions',
            difficulty: 'Medium',
            isActive: true,
            tags: ['transactions', 'acid', 'database'],
            hints: ['Atomicity, Consistency, Isolation, Durability'],
            companyTags: ['Oracle', 'Microsoft'],
        },
        {
            text: 'Explain normalization. What are 1NF, 2NF, and 3NF?',
            domain: 'DBMS',
            topic: 'Normalization',
            difficulty: 'Medium',
            isActive: true,
            tags: ['normalization', 'schema-design', 'database'],
            hints: ['Think about data redundancy', 'Consider functional dependencies'],
            companyTags: ['Amazon', 'Infosys'],
        },
        {
            text: 'What is indexing in databases? Explain B-tree indexes.',
            domain: 'DBMS',
            topic: 'Indexing',
            difficulty: 'Hard',
            isActive: true,
            tags: ['indexing', 'btree', 'performance'],
            hints: ['Think about tree structure', 'Consider disk I/O'],
            companyTags: ['Oracle', 'Google'],
        }
    ];

    for (const q of questions) {
        try {
            const created = await prisma.question.create({ data: q });

            // Create rubric for each
            await prisma.rubric.create({
                data: {
                    questionId: created.id,
                    mustHave: [
                        `Explains core concept of ${q.topic}`,
                        'Demonstrates technical understanding',
                        'Provides accurate information'
                    ],
                    goodToHave: [
                        'Uses practical examples',
                        'Mentions real-world use cases',
                        'Compares alternatives'
                    ],
                    redFlags: [
                        'Confuses key terminology',
                        'Provides incorrect information'
                    ],
                }
            });
            console.log(`✓ Created: ${q.domain} - ${q.topic} (${q.difficulty})`);
        } catch (err) {
            console.error(`✗ Failed: ${q.topic}:`, err.message);
        }
    }

    console.log('\n✅ Seeding complete!');
    await prisma.$disconnect();
}

seed().catch(console.error);
