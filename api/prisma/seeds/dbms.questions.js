/**
 * Seed Questions - DBMS Domain
 * 12 questions covering SQL, normalization, indexing, transactions, etc.
 */

const dbmsQuestions = [
    {
        domain: 'DBMS',
        topic: 'dbms.normalization',
        difficulty: 'Medium',
        text: 'Explain database normalization. What are 1NF, 2NF, and 3NF?',
        tags: ['normalization', 'database-design'],
        hints: ['Reducing redundancy', 'Functional dependencies'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                '1NF: Atomic values, no repeating groups',
                '2NF: 1NF + no partial dependencies',
                '3NF: 2NF + no transitive dependencies',
                'Purpose: reduce data redundancy',
            ],
            goodToHave: [
                'BCNF (Boyce-Codd Normal Form)',
                'Denormalization for performance',
                'Examples of each form',
            ],
            redFlags: [
                'Normalization improves query performance',
                '3NF eliminates all redundancy',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.indexing',
        difficulty: 'Medium',
        text: 'What is database indexing? Explain B-Tree vs Hash indexing.',
        tags: ['indexing', 'performance', 'b-tree'],
        hints: ['Query optimization', 'Data structures'],
        companyTags: ['Amazon', 'Google', 'Flipkart'],
        rubric: {
            mustHave: [
                'Index speeds up data retrieval',
                'B-Tree: supports range queries, ordered data',
                'Hash: O(1) exact match, no range support',
                'Trade-off: faster reads, slower writes',
            ],
            goodToHave: [
                'Clustered vs non-clustered indexes',
                'Composite indexes',
                'When indexes hurt performance',
            ],
            redFlags: [
                'Indexes improve all query types',
                'More indexes always better',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.acid',
        difficulty: 'Easy',
        text: 'What are ACID properties in database transactions?',
        tags: ['transactions', 'acid', 'consistency'],
        hints: ['Four properties', 'Reliability guarantees'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Atomicity: all or nothing',
                'Consistency: valid state to valid state',
                'Isolation: concurrent transactions isolated',
                'Durability: committed data persists',
            ],
            goodToHave: [
                'Isolation levels',
                'WAL (Write-Ahead Logging)',
                'Trade-offs with performance',
            ],
            redFlags: [
                'ACID only applies to SQL databases',
                'All databases guarantee ACID',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.joins',
        difficulty: 'Easy',
        text: 'Explain different types of SQL JOINs with examples.',
        tags: ['sql', 'joins', 'queries'],
        hints: ['INNER, LEFT, RIGHT, FULL', 'Cartesian product'],
        companyTags: ['TCS', 'Infosys', 'Amazon'],
        rubric: {
            mustHave: [
                'INNER JOIN: only matching rows',
                'LEFT JOIN: all left + matching right',
                'RIGHT JOIN: all right + matching left',
                'FULL OUTER JOIN: all rows from both',
            ],
            goodToHave: [
                'CROSS JOIN (Cartesian product)',
                'Self JOIN',
                'Performance implications',
            ],
            redFlags: [
                'LEFT and RIGHT JOIN are identical',
                'INNER JOIN includes non-matching rows',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.sql',
        difficulty: 'Medium',
        text: 'What is the difference between WHERE and HAVING clauses?',
        tags: ['sql', 'aggregation', 'filtering'],
        hints: ['Aggregation context', 'Execution order'],
        companyTags: ['TCS', 'Infosys', 'Amazon'],
        rubric: {
            mustHave: [
                'WHERE filters before grouping',
                'HAVING filters after grouping',
                'WHERE cannot use aggregate functions',
                'HAVING works with GROUP BY',
            ],
            goodToHave: [
                'Execution order of SQL clauses',
                'Performance considerations',
                'Examples combining both',
            ],
            redFlags: [
                'WHERE and HAVING are interchangeable',
                'HAVING cannot filter groups',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.transactions',
        difficulty: 'Medium',
        text: 'Explain different isolation levels in database transactions.',
        tags: ['transactions', 'isolation', 'concurrency'],
        hints: ['Dirty reads, phantom reads', 'Trade-offs'],
        companyTags: ['Amazon', 'Goldman Sachs', 'Google'],
        rubric: {
            mustHave: [
                'Read Uncommitted: allows dirty reads',
                'Read Committed: prevents dirty reads',
                'Repeatable Read: prevents non-repeatable reads',
                'Serializable: highest isolation, prevents phantom reads',
            ],
            goodToHave: [
                'Performance vs consistency trade-off',
                'Default isolation levels by database',
                'Optimistic vs pessimistic locking',
            ],
            redFlags: [
                'Higher isolation always better',
                'All databases use same default level',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.keys',
        difficulty: 'Easy',
        text: 'Explain the difference between primary key, foreign key, and unique key.',
        tags: ['keys', 'constraints', 'database-design'],
        hints: ['Uniqueness', 'Relationships'],
        companyTags: ['TCS', 'Infosys', 'Wipro'],
        rubric: {
            mustHave: [
                'Primary key: unique identifier, not null',
                'Foreign key: references primary key of another table',
                'Unique key: ensures uniqueness, can be null',
                'Table can have only one primary key',
            ],
            goodToHave: [
                'Composite primary keys',
                'Cascade options for foreign keys',
                'Candidate keys concept',
            ],
            redFlags: [
                'Primary key can have null values',
                'Foreign key must be primary key in child table',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.nosql',
        difficulty: 'Medium',
        text: 'Compare SQL and NoSQL databases. When would you use each?',
        tags: ['nosql', 'database-types', 'architecture'],
        hints: ['Schema flexibility', 'Scaling patterns'],
        companyTags: ['Amazon', 'Google', 'Netflix'],
        rubric: {
            mustHave: [
                'SQL: structured schema, ACID, vertical scaling',
                'NoSQL: flexible schema, eventual consistency, horizontal scaling',
                'SQL: complex queries, joins',
                'NoSQL: high volume, varied data structures',
            ],
            goodToHave: [
                'Types of NoSQL (document, key-value, graph, columnar)',
                'CAP theorem',
                'Use case examples',
            ],
            redFlags: [
                'NoSQL cannot handle relationships',
                'SQL databases cannot scale horizontally',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.views',
        difficulty: 'Easy',
        text: 'What is a database view? What are its advantages and disadvantages?',
        tags: ['views', 'sql', 'abstraction'],
        hints: ['Virtual table', 'Security'],
        companyTags: ['TCS', 'Infosys', 'Amazon'],
        rubric: {
            mustHave: [
                'View is a virtual table based on query',
                'Simplifies complex queries',
                'Provides data abstraction and security',
                'Does not store data (usually)',
            ],
            goodToHave: [
                'Materialized views',
                'Updatable views',
                'Performance considerations',
            ],
            redFlags: [
                'Views always improve performance',
                'Views store data like tables',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.deadlock',
        difficulty: 'Medium',
        text: 'What is a deadlock in databases? How can it be prevented?',
        tags: ['deadlock', 'concurrency', 'locking'],
        hints: ['Circular wait', 'Prevention strategies'],
        companyTags: ['Amazon', 'Microsoft', 'Goldman Sachs'],
        rubric: {
            mustHave: [
                'Circular wait between transactions',
                'Each waits for resource held by another',
                'Prevention: lock ordering, timeouts',
                'Detection: wait-for graphs',
            ],
            goodToHave: [
                'Deadlock recovery (rollback)',
                'Two-phase locking',
                'Optimistic locking alternative',
            ],
            redFlags: [
                'Deadlocks only occur in SQL databases',
                'Deadlocks are always preventable',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.stored-procedures',
        difficulty: 'Medium',
        text: 'What are stored procedures? What are their pros and cons?',
        tags: ['stored-procedures', 'sql', 'database-programming'],
        hints: ['Pre-compiled SQL', 'Business logic'],
        companyTags: ['Amazon', 'Oracle', 'Microsoft'],
        rubric: {
            mustHave: [
                'Pre-compiled SQL code stored in database',
                'Reduces network traffic',
                'Provides security through encapsulation',
                'Can contain business logic',
            ],
            goodToHave: [
                'Parameterized procedures',
                'Debugging challenges',
                'Version control difficulties',
            ],
            redFlags: [
                'Stored procedures are always faster',
                'Easy to unit test like application code',
            ],
        },
    },
    {
        domain: 'DBMS',
        topic: 'dbms.sharding',
        difficulty: 'Hard',
        text: 'What is database sharding? Explain horizontal vs vertical partitioning.',
        tags: ['sharding', 'partitioning', 'scaling'],
        hints: ['Distributing data', 'Scalability'],
        companyTags: ['Google', 'Facebook', 'Amazon'],
        rubric: {
            mustHave: [
                'Sharding: horizontal partitioning across servers',
                'Horizontal: rows distributed by shard key',
                'Vertical: columns split into tables',
                'Improves scalability and performance',
            ],
            goodToHave: [
                'Shard key selection criteria',
                'Cross-shard queries challenges',
                'Consistent hashing',
            ],
            redFlags: [
                'Sharding simplifies queries',
                'Sharding is always beneficial',
            ],
        },
    },
];

module.exports = { dbmsQuestions };
