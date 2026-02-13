// Configuration Constants
const DOMAINS = {
    DSA: 'DSA',
    JAVA: 'Java',
    CPP: 'CPP',
    C: 'C',
    REACT: 'React',
    DBMS: 'DBMS',
    OS: 'OS',
    HR: 'HR',
};

const DIFFICULTIES = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
};

const SESSION_MODES = {
    PRACTICE: 'Practice',
    TIMED: 'Timed',
    COMPANY: 'Company',
};

const SESSION_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
};

const POLICY_THRESHOLDS = {
    FOLLOW_UP_THRESHOLD: 4,      // Score below this triggers follow-up
    DIFFICULTY_UP_THRESHOLD: 7.5, // Score above this increases difficulty
    TOPIC_SWITCH_THRESHOLD: 3,   // Score below this (2x) switches topic
    MAX_FOLLOW_UP_DEPTH: 3,
    MAX_QUESTIONS: 10,
};

const SCORING = {
    MUST_HAVE_WEIGHT: 6,  // Points for must-have
    GOOD_TO_HAVE_WEIGHT: 3, // Points for good-to-have
    WRONG_CLAIM_PENALTY: 1.5, // Penalty per wrong claim
    MAX_SCORE: 10,
    MIN_SCORE: 0,
};

const REDIS_KEYS = {
    SESSION: (id) => `session:${id}`,
    RATE_LIMIT: (userId) => `rate:${userId}`,
    CACHE_RUBRIC: (qId) => `cache:rubric:${qId}`,
    CACHE_QUESTION: (qId) => `cache:question:${qId}`,
};

const QUEUE_NAMES = {
    REPORT_GENERATION: 'report-generation',
    ROADMAP_GENERATION: 'roadmap-generation',
    EMBEDDING_GENERATION: 'embedding-generation',
    RUBRIC_GENERATION: 'rubric-generation',
};

module.exports = {
    DOMAINS,
    DIFFICULTIES,
    SESSION_MODES,
    SESSION_STATUS,
    POLICY_THRESHOLDS,
    SCORING,
    REDIS_KEYS,
    QUEUE_NAMES,
};
