/**
 * Domain types for interview questions
 */
const Domain = {
    DSA: 'DSA',
    JAVA: 'Java',
    CPP: 'CPP',
    C: 'C',
    REACT: 'React',
    DBMS: 'DBMS',
    OS: 'OS',
    HR: 'HR',
};

/**
 * Difficulty levels
 */
const Difficulty = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
};

/**
 * Session modes
 */
const SessionMode = {
    PRACTICE: 'Practice',
    TIMED: 'Timed',
    COMPANY: 'Company',
};

/**
 * Session status
 */
const SessionStatus = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
};

/**
 * User roles
 */
const UserRole = {
    USER: 'user',
    ADMIN: 'admin',
    PREMIUM: 'premium',
};

/**
 * LLM providers
 */
const LLMProvider = {
    GROQ: 'groq',
    GEMINI: 'gemini',
    OPENAI: 'openai',
};

/**
 * Skill trend directions
 */
const SkillTrend = {
    IMPROVING: 'improving',
    DECLINING: 'declining',
    STABLE: 'stable',
};

/**
 * Decision types from policy engine
 */
const PolicyDecision = {
    FOLLOW_UP: 'follow_up',
    INCREASE_DIFFICULTY: 'increase_difficulty',
    DECREASE_DIFFICULTY: 'decrease_difficulty',
    SWITCH_TOPIC: 'switch_topic',
    END_SESSION: 'end_session',
    CONTINUE: 'continue',
};

module.exports = {
    Domain,
    Difficulty,
    SessionMode,
    SessionStatus,
    UserRole,
    LLMProvider,
    SkillTrend,
    PolicyDecision,
};
