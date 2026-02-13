/**
 * Interviewer Service
 * 
 * Handles intelligent question selection and follow-up generation:
 * - Topic selection based on skill gaps
 * - Question selection (avoid repeats, match difficulty)
 * - Follow-up question generation via LLM
 */

const { prisma } = require('../db/prisma');
const { llmService } = require('./llm.service');
const { policyEngine } = require('./policy-engine.service');

class InterviewerService {

    // ============= TOPIC SELECTION =============

    /**
     * Select next topic based on user's skill profile and session history
     */
    async selectTopic(userId, domain, sessionState = {}) {
        const { askedTopics = [], currentTopic, recentScores = [] } = sessionState;

        // Get available topics for the domain
        const availableTopics = await this.getAvailableTopics(domain);

        if (availableTopics.length === 0) {
            return null;
        }

        // Get user's skill profile if available
        let skillProfile = [];
        if (userId) {
            try {
                skillProfile = await prisma.skillProfile.findMany({
                    where: { userId, domain },
                    orderBy: { masteryScore: 'asc' }, // Weakest first
                });
            } catch (error) {
                console.warn('[Interviewer] Could not load skill profile:', error.message);
            }
        }

        // Check if policy engine suggests a topic switch
        const policyDecision = sessionState.lastPolicyDecision;
        if (policyDecision?.action === 'switch_topic') {
            // Exclude current topic temporarily
            const eligibleTopics = availableTopics.filter(t => t !== currentTopic);
            if (eligibleTopics.length > 0) {
                return this.selectWeakestTopic(eligibleTopics, skillProfile, askedTopics);
            }
        }

        // Use policy engine's topic selection
        return policyEngine.selectNextTopic(skillProfile, askedTopics, availableTopics);
    }

    /**
     * Get all available topics for a domain
     */
    async getAvailableTopics(domain) {
        const topics = await prisma.question.findMany({
            where: { domain, isActive: true },
            select: { topic: true },
            distinct: ['topic'],
        });

        return topics.map(t => t.topic);
    }

    /**
     * Select the weakest topic from available options
     */
    selectWeakestTopic(topics, skillProfile, recentlyAsked = []) {
        // Filter out recently asked topics (cooldown)
        const cooldownTopics = new Set(recentlyAsked.slice(0, 3));
        const eligible = topics.filter(t => !cooldownTopics.has(t));

        if (eligible.length === 0) {
            return topics[0];
        }

        // Find weakest topic based on skill profile
        const skillMap = new Map(skillProfile.map(s => [s.topic, s.masteryScore]));

        eligible.sort((a, b) => {
            const scoreA = skillMap.get(a) ?? 50; // Default 50% mastery
            const scoreB = skillMap.get(b) ?? 50;
            return scoreA - scoreB; // Lower mastery first
        });

        return eligible[0];
    }

    // ============= QUESTION SELECTION =============

    /**
     * Select next question based on topic, difficulty, and history
     */
    async selectQuestion(options = {}) {
        const {
            domain,
            topic,
            difficulty = 'Medium',
            excludeIds = [],
            userId,
            preferFollowUp = false,
            companyTags = null,
        } = options;

        // Build query
        const where = {
            isActive: true,
            id: { notIn: excludeIds },
        };

        if (domain) where.domain = domain;
        if (topic) where.topic = topic;
        if (difficulty) where.difficulty = difficulty;
        if (companyTags && companyTags.length > 0) {
            where.companyTags = { hasSome: companyTags };
        }

        // Get candidate questions
        let questions = await prisma.question.findMany({
            where,
            include: { rubric: true },
            take: 20,
        });

        // Filter to only questions with rubrics
        questions = questions.filter(q => q.rubric);

        if (questions.length === 0) {
            // Fallback: try without difficulty filter
            delete where.difficulty;
            questions = await prisma.question.findMany({
                where,
                include: { rubric: true },
                take: 20,
            });
            questions = questions.filter(q => q.rubric);
        }

        if (questions.length === 0) {
            return null;
        }

        // If user has history, prefer questions they haven't seen
        if (userId) {
            const seenQuestionIds = await this.getSeenQuestionIds(userId);
            const unseenQuestions = questions.filter(q => !seenQuestionIds.has(q.id));

            if (unseenQuestions.length > 0) {
                questions = unseenQuestions;
            }
        }

        // Random selection from candidates
        const randomIndex = Math.floor(Math.random() * questions.length);
        return questions[randomIndex];
    }

    /**
     * Get IDs of questions the user has already seen
     */
    async getSeenQuestionIds(userId) {
        const events = await prisma.sessionEvent.findMany({
            where: {
                session: { userId },
            },
            select: { questionId: true },
            distinct: ['questionId'],
        });

        return new Set(events.map(e => e.questionId));
    }

    /**
     * Select question matching policy engine decision
     */
    async selectQuestionByPolicy(domain, policyDecision, sessionState = {}) {
        const { askedQuestionIds = [], currentTopic, currentDifficulty } = sessionState;

        let topic = currentTopic;
        let difficulty = currentDifficulty || 'Medium';

        // Apply policy decision
        const action = policyDecision.action;

        if (action === 'switch_topic') {
            topic = await this.selectTopic(sessionState.userId, domain, sessionState);
            difficulty = policyDecision.suggestedDifficulty || 'Easy';
        } else if (action === 'increase_difficulty') {
            difficulty = this.adjustDifficulty(currentDifficulty, 1);
        } else if (action === 'decrease_difficulty' || policyDecision.toDifficulty) {
            difficulty = policyDecision.toDifficulty || this.adjustDifficulty(currentDifficulty, -1);
        }

        return this.selectQuestion({
            domain,
            topic,
            difficulty,
            excludeIds: askedQuestionIds,
            userId: sessionState.userId,
        });
    }

    /**
     * Adjust difficulty level up or down
     */
    adjustDifficulty(current, direction) {
        const levels = ['Easy', 'Medium', 'Hard'];
        const currentIndex = levels.indexOf(current);
        const newIndex = Math.max(0, Math.min(levels.length - 1, currentIndex + direction));
        return levels[newIndex];
    }

    // ============= FOLLOW-UP QUESTION GENERATION =============

    /**
     * Generate a follow-up question based on the previous answer
     */
    async generateFollowUp(context) {
        const {
            question,
            userAnswer,
            evaluation,
            depth = 1,
            focusArea = null,
        } = context;

        // Determine focus area if not specified
        const missedPoints = evaluation?.pointsMissed || evaluation?.coverage?.mustHave?.missing || [];
        const focus = focusArea || (missedPoints.length > 0 ? missedPoints[0] : null);

        const difficultyAdjustment = evaluation?.score < 4 ? 'easier' : 'same level';

        const prompt = `Generate a follow-up interview question.

ORIGINAL QUESTION: "${question.text}"
TOPIC: ${question.topic}
DOMAIN: ${question.domain}

USER'S PREVIOUS ANSWER SUMMARY:
"${userAnswer.substring(0, 500)}"

SCORE: ${evaluation?.score || 'N/A'}/10

${focus ? `FOCUS AREA (user missed this): ${typeof focus === 'object' ? focus.text : focus}` : ''}

FOLLOW-UP DEPTH: ${depth} (1=first follow-up, 2=second, etc.)

Generate a ${difficultyAdjustment} follow-up question that:
${depth === 1 ? '- Probes deeper into a specific aspect they mentioned' : ''}
${depth >= 2 ? '- Clarifies a fundamental concept they may have confused' : ''}
${focus ? '- Addresses the missed concept without directly revealing the answer' : ''}
- Is specific and focused (not broad)
- Can be answered in 2-3 sentences

Respond with JSON:
{
  "question": "the follow-up question text",
  "targetConcept": "what concept this tests",
  "expectedKeyPoints": ["point 1", "point 2"],
  "difficulty": "Easy|Medium|Hard",
  "rationale": "why this follow-up is appropriate"
}`;

        try {
            const result = await llmService.generateJSON(prompt, {
                temperature: 0.6,
                maxTokens: 500,
            });

            return {
                text: result.question,
                isFollowUp: true,
                followUpDepth: depth,
                parentQuestionId: question.id,
                targetConcept: result.targetConcept,
                expectedKeyPoints: result.expectedKeyPoints || [],
                difficulty: result.difficulty || question.difficulty,
                rationale: result.rationale,
                domain: question.domain,
                topic: question.topic,
            };
        } catch (error) {
            console.error('[Interviewer] Follow-up generation failed:', error.message);

            // Fallback to a generic follow-up
            return {
                text: `Can you explain more about ${focus || 'your approach'} in the context of ${question.topic}?`,
                isFollowUp: true,
                followUpDepth: depth,
                parentQuestionId: question.id,
                difficulty: question.difficulty,
                domain: question.domain,
                topic: question.topic,
            };
        }
    }

    // ============= HINTS =============

    /**
     * Generate a hint for the current question
     */
    async generateHint(question, attemptNumber = 1) {
        // Use stored hints if available
        if (question.hints && question.hints.length >= attemptNumber) {
            return {
                hint: question.hints[attemptNumber - 1],
                hintNumber: attemptNumber,
                source: 'stored',
            };
        }

        // Generate hint via LLM
        const prompt = `Generate a helpful hint for this interview question.

QUESTION: "${question.text}"
TOPIC: ${question.topic}
HINT NUMBER: ${attemptNumber} (earlier hints should be more subtle)

${attemptNumber === 1 ? 'Give a subtle nudge without revealing the answer.' : ''}
${attemptNumber === 2 ? 'Provide a more direct hint about the approach.' : ''}
${attemptNumber >= 3 ? 'Give a significant hint that points to the key concept.' : ''}

Respond with JSON:
{
  "hint": "the hint text",
  "revealLevel": 1-5 (how much this reveals)
}`;

        try {
            const result = await llmService.generateJSON(prompt, {
                temperature: 0.5,
                maxTokens: 200,
            });

            return {
                hint: result.hint,
                hintNumber: attemptNumber,
                revealLevel: result.revealLevel,
                source: 'generated',
            };
        } catch (error) {
            return {
                hint: 'Think about the fundamental concepts related to this topic.',
                hintNumber: attemptNumber,
                source: 'fallback',
            };
        }
    }
}

const interviewerService = new InterviewerService();

module.exports = { InterviewerService, interviewerService };
