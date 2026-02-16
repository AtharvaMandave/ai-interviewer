/**
 * Hybrid Evaluation Service
 * 
 * Implements the 10-step hybrid evaluation pipeline:
 * 1. Rubric Fetch
 * 2. Normalize Rubric Points
 * 3. Extract Claims from User Answer (LLM)
 * 4. Semantic Matching using Embeddings
 * 5. Covered/Missing/Partial Classification
 * 6. Deterministic Score Calculation
 * 7. Feedback Generation (LLM)
 * 8. Policy Engine (Next Action)
 * 9. Store Evaluation
 * 10. Update Skill Profile
 */

const { llmService } = require('./llm.service');
const { embeddingsService } = require('./embeddings.service');
const { policyEngine } = require('./policy-engine.service');
const { prisma } = require('../db/prisma');

// Scoring weights
const SCORING = {
    MUST_HAVE_WEIGHT: 6,      // Out of 10
    GOOD_TO_HAVE_WEIGHT: 3,   // Out of 10
    CLARITY_WEIGHT: 1,        // Out of 10
    RED_FLAG_PENALTY: 1.5,    // Per red flag
    MAX_SCORE: 10,
    MIN_SCORE: 0,
};

// Similarity thresholds
const THRESHOLDS = {
    COVERED: 0.78,
    PARTIAL: 0.70,
};

class HybridEvaluationService {

    // ============= STEP 1: RUBRIC FETCH =============

    /**
     * Fetch and return rubric for a question
     */
    async fetchRubric(questionId) {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: { rubric: true },
        });

        if (!question) {
            throw new Error(`Question not found: ${questionId}`);
        }

        if (!question.rubric) {
            throw new Error(`No rubric found for question: ${questionId}`);
        }

        return {
            question,
            rubric: question.rubric,
        };
    }

    // ============= STEP 2: NORMALIZE RUBRIC POINTS =============

    /**
     * Ensure rubric field is an array. Handles legacy data stored as strings.
     */
    ensureArray(value) {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value.trim()) {
            // Split on newlines, semicolons, or numbered list patterns
            const parts = value.split(/[\n;]|\d+\.\s/)
                .map(s => s.trim())
                .filter(s => s.length > 3);
            return parts.length > 0 ? parts : [value.trim()];
        }
        return [];
    }

    /**
     * Normalize rubric into structured points with IDs and tags
     */
    normalizeRubricPoints(rubric) {
        const points = [];
        let idCounter = 0;

        // Must-have points (safely handle string or array)
        const mustHave = this.ensureArray(rubric.mustHave);
        mustHave.forEach((text, index) => {
            points.push({
                id: `must_${idCounter++}`,
                type: 'mustHave',
                text: text,
                tags: this.extractTags(text),
                weight: 1.0,
                index,
            });
        });

        // Good-to-have points
        const goodToHave = this.ensureArray(rubric.goodToHave);
        goodToHave.forEach((text, index) => {
            points.push({
                id: `good_${idCounter++}`,
                type: 'goodToHave',
                text: text,
                tags: this.extractTags(text),
                weight: 0.5,
                index,
            });
        });

        // Red flags
        const redFlags = this.ensureArray(rubric.redFlags);
        redFlags.forEach((text, index) => {
            points.push({
                id: `flag_${idCounter++}`,
                type: 'redFlag',
                text: text,
                tags: this.extractTags(text),
                weight: -1.5,
                index,
            });
        });

        return points;
    }

    /**
     * Extract tags from a point text
     */
    extractTags(text) {
        // Extract key technical terms as tags
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);

        // Remove common words
        const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'been', 'will', 'should', 'could', 'would', 'when', 'where', 'what', 'which', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'each', 'more', 'most', 'other', 'some', 'such', 'only', 'same', 'than', 'very', 'also', 'just', 'because', 'explains', 'mentions', 'describes', 'understands', 'knows']);

        return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 5);
    }

    // ============= STEP 3: EXTRACT CLAIMS FROM USER ANSWER (LLM) =============

    /**
     * Use LLM to extract structured claims from user answer
     */
    async extractClaims(question, userAnswer, rubricPoints) {
        const mustHavePoints = rubricPoints.filter(p => p.type === 'mustHave').map(p => p.text);
        const goodToHavePoints = rubricPoints.filter(p => p.type === 'goodToHave').map(p => p.text);
        const redFlagPoints = rubricPoints.filter(p => p.type === 'redFlag').map(p => p.text);

        const prompt = `Analyze this interview answer and extract structured information.

QUESTION: "${question.text}"
TOPIC: ${question.topic}
DOMAIN: ${question.domain}

USER'S ANSWER:
"${userAnswer}"

EXPECTED CONCEPTS (for reference):
Must Cover: ${mustHavePoints.join('; ')}
Bonus Points: ${goodToHavePoints.join('; ')}
Incorrect Statements to Watch For: ${redFlagPoints.join('; ')}

TASK:
1. Extract all factual claims made by the user (what concepts they explained)
2. Identify any incorrect or wrong claims
3. Rate the answer's clarity (0-1) and structure (0-1)

Respond with JSON only:
{
  "claims": ["claim 1", "claim 2", ...],
  "wrongClaims": ["incorrect statement 1", ...],
  "answerQuality": {
    "clarity": 0.0-1.0,
    "structure": 0.0-1.0
  }
}`;

        try {
            const result = await llmService.generateJSON(prompt, {
                temperature: 0.2,
                maxTokens: 1000,
            });

            return {
                claims: result.claims || [],
                wrongClaims: result.wrongClaims || [],
                answerQuality: {
                    clarity: result.answerQuality?.clarity || 0.5,
                    structure: result.answerQuality?.structure || 0.5,
                },
            };
        } catch (error) {
            console.error('[HybridEval] Claim extraction failed:', error.message);
            // Fallback: split answer into sentences as claims
            return {
                claims: userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 10),
                wrongClaims: [],
                answerQuality: { clarity: 0.5, structure: 0.5 },
            };
        }
    }

    // ============= STEP 4: SEMANTIC MATCHING USING EMBEDDINGS =============

    /**
     * Match extracted claims to rubric points using embeddings or LLM fallback
     */
    async semanticMatch(claims, rubricPoints) {
        const hasEmbeddingAPI = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

        // Use LLM-based matching when no embedding API is available (more accurate)
        if (!hasEmbeddingAPI) {
            return this.llmBasedMatch(claims, rubricPoints);
        }

        // Embedding-based matching (original approach)
        const matchResults = {
            mustHave: { covered: [], partial: [], missing: [] },
            goodToHave: { covered: [], partial: [], missing: [] },
            redFlags: { triggered: [] },
            detailedMatches: [],
        };

        const claimsText = claims.join('. ');

        for (const point of rubricPoints) {
            const matches = await embeddingsService.matchClaimToRubric(claimsText, [point]);
            const bestMatch = matches[0];

            matchResults.detailedMatches.push({
                pointId: point.id,
                pointText: point.text,
                pointType: point.type,
                similarity: bestMatch.similarity,
                coverage: bestMatch.coverage,
            });

            if (point.type === 'mustHave') {
                if (bestMatch.coverage === 'covered') {
                    matchResults.mustHave.covered.push(point);
                } else if (bestMatch.coverage === 'partial') {
                    matchResults.mustHave.partial.push(point);
                } else {
                    matchResults.mustHave.missing.push(point);
                }
            } else if (point.type === 'goodToHave') {
                if (bestMatch.coverage === 'covered') {
                    matchResults.goodToHave.covered.push(point);
                } else if (bestMatch.coverage === 'partial') {
                    matchResults.goodToHave.partial.push(point);
                } else {
                    matchResults.goodToHave.missing.push(point);
                }
            }
        }

        return matchResults;
    }

    /**
     * LLM-based matching using Groq/Gemini
     * Asks the LLM to directly classify which rubric points are covered
     * More accurate than embedding fallbacks when no embedding API is available
     */
    async llmBasedMatch(claims, rubricPoints) {
        const matchResults = {
            mustHave: { covered: [], partial: [], missing: [] },
            goodToHave: { covered: [], partial: [], missing: [] },
            redFlags: { triggered: [] },
            detailedMatches: [],
        };

        const mustHavePoints = rubricPoints.filter(p => p.type === 'mustHave');
        const goodToHavePoints = rubricPoints.filter(p => p.type === 'goodToHave');

        const prompt = `You are evaluating an interview answer. Classify which rubric points are covered by the user's claims.

USER'S CLAIMS (extracted from their answer):
${claims.map((c, i) => `${i + 1}. ${c}`).join('\n')}

MUST-HAVE RUBRIC POINTS:
${mustHavePoints.map((p, i) => `M${i}: ${p.text}`).join('\n')}

GOOD-TO-HAVE RUBRIC POINTS:
${goodToHavePoints.map((p, i) => `G${i}: ${p.text}`).join('\n')}

For each rubric point, classify as:
- "covered" = the claims clearly address this point
- "partial" = the claims touch on this but don't fully cover it  
- "missing" = the claims don't address this point at all

Respond with JSON only:
{
  "mustHave": { "M0": "covered|partial|missing", "M1": "covered|partial|missing", ... },
  "goodToHave": { "G0": "covered|partial|missing", "G1": "covered|partial|missing", ... }
}`;

        try {
            const result = await llmService.generateJSON(prompt, {
                temperature: 0.1,
                maxTokens: 500,
            });

            // Process must-have points
            mustHavePoints.forEach((point, i) => {
                const key = `M${i}`;
                const coverage = result.mustHave?.[key] || 'missing';
                const sim = coverage === 'covered' ? 0.9 : coverage === 'partial' ? 0.75 : 0.3;

                matchResults.detailedMatches.push({
                    pointId: point.id,
                    pointText: point.text,
                    pointType: point.type,
                    similarity: sim,
                    coverage,
                });

                if (coverage === 'covered') matchResults.mustHave.covered.push(point);
                else if (coverage === 'partial') matchResults.mustHave.partial.push(point);
                else matchResults.mustHave.missing.push(point);
            });

            // Process good-to-have points
            goodToHavePoints.forEach((point, i) => {
                const key = `G${i}`;
                const coverage = result.goodToHave?.[key] || 'missing';
                const sim = coverage === 'covered' ? 0.9 : coverage === 'partial' ? 0.75 : 0.3;

                matchResults.detailedMatches.push({
                    pointId: point.id,
                    pointText: point.text,
                    pointType: point.type,
                    similarity: sim,
                    coverage,
                });

                if (coverage === 'covered') matchResults.goodToHave.covered.push(point);
                else if (coverage === 'partial') matchResults.goodToHave.partial.push(point);
                else matchResults.goodToHave.missing.push(point);
            });

        } catch (error) {
            console.error('[HybridEval] LLM matching failed, using keyword fallback:', error.message);
            // Fall back to keyword-based matching via embeddings service
            return this.keywordFallbackMatch(claims, rubricPoints);
        }

        return matchResults;
    }

    /**
     * Keyword-based matching fallback (last resort)
     */
    keywordFallbackMatch(claims, rubricPoints) {
        const matchResults = {
            mustHave: { covered: [], partial: [], missing: [] },
            goodToHave: { covered: [], partial: [], missing: [] },
            redFlags: { triggered: [] },
            detailedMatches: [],
        };

        const claimsText = claims.join('. ');

        for (const point of rubricPoints) {
            const matches = embeddingsService.keywordMatchClaimToRubric(claimsText, [point]);
            const bestMatch = matches[0];

            matchResults.detailedMatches.push({
                pointId: point.id,
                pointText: point.text,
                pointType: point.type,
                similarity: bestMatch.similarity,
                coverage: bestMatch.coverage,
            });

            if (point.type === 'mustHave') {
                if (bestMatch.coverage === 'covered') matchResults.mustHave.covered.push(point);
                else if (bestMatch.coverage === 'partial') matchResults.mustHave.partial.push(point);
                else matchResults.mustHave.missing.push(point);
            } else if (point.type === 'goodToHave') {
                if (bestMatch.coverage === 'covered') matchResults.goodToHave.covered.push(point);
                else if (bestMatch.coverage === 'partial') matchResults.goodToHave.partial.push(point);
                else matchResults.goodToHave.missing.push(point);
            }
        }

        return matchResults;
    }

    /**
     * Check if answer triggers any red flags using LLM or keyword matching
     */
    async checkRedFlags(wrongClaims, rubricPoints) {
        const redFlagPoints = rubricPoints.filter(p => p.type === 'redFlag');
        const triggered = [];

        if (wrongClaims.length === 0 || redFlagPoints.length === 0) {
            return triggered;
        }

        const hasEmbeddingAPI = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

        for (const wrongClaim of wrongClaims) {
            for (const redFlag of redFlagPoints) {
                let isMatch = false;
                let similarity = 0;

                if (hasEmbeddingAPI) {
                    const matches = await embeddingsService.matchClaimToRubric(wrongClaim, [redFlag]);
                    similarity = matches[0].similarity;
                    isMatch = similarity >= THRESHOLDS.PARTIAL;
                } else {
                    // Keyword-based red flag check
                    const matches = embeddingsService.keywordMatchClaimToRubric(wrongClaim, [redFlag]);
                    similarity = matches[0].similarity;
                    isMatch = matches[0].coverage === 'covered' || matches[0].coverage === 'partial';
                }

                if (isMatch) {
                    triggered.push({
                        redFlag: redFlag.text,
                        matchedClaim: wrongClaim,
                        similarity,
                    });
                }
            }
        }

        return triggered;
    }

    // ============= STEP 5 & 6: CLASSIFICATION & DETERMINISTIC SCORING =============

    /**
     * Calculate final score using deterministic formula
     */
    calculateScore(matchResults, triggeredRedFlags, answerQuality) {
        const totalMustHave = matchResults.mustHave.covered.length +
            matchResults.mustHave.partial.length +
            matchResults.mustHave.missing.length;

        const totalGoodToHave = matchResults.goodToHave.covered.length +
            matchResults.goodToHave.partial.length +
            matchResults.goodToHave.missing.length;

        // Must-have score (6 points max)
        // Full credit for covered, half for partial
        const coveredMustScore = matchResults.mustHave.covered.length;
        const partialMustScore = matchResults.mustHave.partial.length * 0.5;
        const mustScore = totalMustHave > 0
            ? ((coveredMustScore + partialMustScore) / totalMustHave) * SCORING.MUST_HAVE_WEIGHT
            : SCORING.MUST_HAVE_WEIGHT;

        // Good-to-have score (3 points max)
        const coveredGoodScore = matchResults.goodToHave.covered.length;
        const partialGoodScore = matchResults.goodToHave.partial.length * 0.5;
        const goodScore = totalGoodToHave > 0
            ? ((coveredGoodScore + partialGoodScore) / totalGoodToHave) * SCORING.GOOD_TO_HAVE_WEIGHT
            : 0;

        // Clarity/structure score (1 point max)
        const clarityScore = ((answerQuality.clarity + answerQuality.structure) / 2) * SCORING.CLARITY_WEIGHT;

        // Red flag penalty
        const penalty = triggeredRedFlags.length * SCORING.RED_FLAG_PENALTY;

        // Final score (clamped 0-10)
        const rawScore = mustScore + goodScore + clarityScore - penalty;
        const finalScore = Math.max(SCORING.MIN_SCORE, Math.min(SCORING.MAX_SCORE, rawScore));

        return {
            finalScore: Math.round(finalScore * 10) / 10, // 1 decimal place
            breakdown: {
                mustHaveScore: Math.round(mustScore * 100) / 100,
                goodToHaveScore: Math.round(goodScore * 100) / 100,
                clarityScore: Math.round(clarityScore * 100) / 100,
                penalty: Math.round(penalty * 100) / 100,
            },
            coverage: {
                mustHave: {
                    covered: matchResults.mustHave.covered.length,
                    partial: matchResults.mustHave.partial.length,
                    missing: matchResults.mustHave.missing.length,
                    total: totalMustHave,
                },
                goodToHave: {
                    covered: matchResults.goodToHave.covered.length,
                    partial: matchResults.goodToHave.partial.length,
                    missing: matchResults.goodToHave.missing.length,
                    total: totalGoodToHave,
                },
                redFlags: triggeredRedFlags.length,
            },
        };
    }

    // ============= STEP 7: FEEDBACK GENERATION (LLM) =============

    /**
     * Generate human-readable feedback
     */
    async generateFeedback(question, userAnswer, scoreResult, matchResults, triggeredRedFlags) {
        const missedPoints = matchResults.mustHave.missing.map(p => p.text);
        const partialPoints = matchResults.mustHave.partial.map(p => p.text);
        const coveredPoints = matchResults.mustHave.covered.map(p => p.text);

        const prompt = `Generate constructive interview feedback.

QUESTION: "${question.text}"
USER'S ANSWER: "${userAnswer}"

SCORE: ${scoreResult.finalScore}/10

COVERED CORRECTLY:
${coveredPoints.length > 0 ? coveredPoints.map(p => `✓ ${p}`).join('\n') : 'None fully covered'}

PARTIALLY COVERED:
${partialPoints.length > 0 ? partialPoints.map(p => `~ ${p}`).join('\n') : 'None'}

MISSING:
${missedPoints.length > 0 ? missedPoints.map(p => `✗ ${p}`).join('\n') : 'None'}

${triggeredRedFlags.length > 0 ? `INCORRECT STATEMENTS:\n${triggeredRedFlags.map(r => `⚠ ${r.matchedClaim}`).join('\n')}` : ''}

Generate feedback that:
1. Acknowledges what the user did well (2-3 points)
2. Explains missing concepts clearly (prioritize most important)
3. Corrects any wrong statements
4. Provides one actionable study tip
5. Suggests a follow-up question to test understanding

Respond with JSON:
{
  "summary": "1-2 sentence overall assessment",
  "didWell": ["strength 1", "strength 2"],
  "needsImprovement": ["improvement 1", "improvement 2"],
  "corrections": ["correction if wrong statement", ...],
  "studyTip": "one specific recommendation",
  "followUpQuestion": "a probing question to ask next"
}`;

        try {
            return await llmService.generateJSON(prompt, {
                temperature: 0.5,
                maxTokens: 1000,
            });
        } catch (error) {
            console.error('[HybridEval] Feedback generation failed:', error.message);
            return {
                summary: `You scored ${scoreResult.finalScore}/10. ${missedPoints.length > 0 ? 'Some key concepts were missing.' : 'Good coverage!'}`,
                didWell: coveredPoints.slice(0, 2),
                needsImprovement: missedPoints.slice(0, 2),
                corrections: triggeredRedFlags.map(r => r.matchedClaim),
                studyTip: 'Review the core concepts for this topic.',
                followUpQuestion: 'Can you explain this concept in more detail?',
            };
        }
    }

    // ============= STEP 8: POLICY ENGINE (NEXT ACTION) =============

    /**
     * Determine next action based on score and session state
     * Delegates to the configurable PolicyEngine
     */
    determineNextAction(scoreResult, sessionState = {}) {
        const { recentScores = [], currentTopic, currentDifficulty, followUpDepth = 0 } = sessionState;

        // Build session state for policy engine
        const policyState = {
            currentScore: scoreResult.finalScore,
            questionNumber: sessionState.questionNumber || 1,
            recentScores: recentScores.map(s => ({
                topic: s.topic,
                score: s.score,
            })),
            currentTopic,
            currentDifficulty: currentDifficulty || 'Medium',
            followUpDepth,
            sessionStartTime: sessionState.sessionStartTime,
        };

        // Delegate to policy engine
        return policyEngine.decide(policyState);
    }

    // ============= STEP 9: STORE EVALUATION =============

    /**
     * Store evaluation results in database
     */
    async storeEvaluation(sessionId, questionId, evaluationData) {
        // Store in session event
        const event = await prisma.sessionEvent.create({
            data: {
                sessionId,
                questionId,
                questionNumber: evaluationData.questionNumber || 1,
                userAnswer: evaluationData.userAnswer,
                score: Math.round(evaluationData.scoreResult.finalScore * 10), // Store as 0-100
                feedback: evaluationData.feedback?.summary || '',
                evaluation: {
                    scoreBreakdown: evaluationData.scoreResult.breakdown,
                    coverage: evaluationData.scoreResult.coverage,
                    claims: evaluationData.claims,
                    wrongClaims: evaluationData.wrongClaims,
                    triggeredRedFlags: evaluationData.triggeredRedFlags.map(r => r.redFlag),
                    answerQuality: evaluationData.answerQuality,
                    detailedMatches: evaluationData.detailedMatches,
                },
                responseTimeMs: evaluationData.responseTimeMs,
                drawingData: evaluationData.drawingData || undefined,
            },
        });

        return event;
    }

    // ============= STEP 10: UPDATE SKILL PROFILE =============

    /**
     * Update user's mastery level for a topic
     * Delegates to SkillProfileService for comprehensive tracking
     */
    async updateSkillProfile(userId, domain, topic, newScore, evaluation = {}) {
        // Lazy-load to avoid circular dependencies
        const { skillProfileService } = require('./skill-profile.service');

        const result = await skillProfileService.updateAfterAnswer(
            userId,
            domain,
            topic,
            newScore,
            evaluation
        );

        return result.change;
    }

    // ============= FULL PIPELINE =============

    /**
     * Execute the complete hybrid evaluation pipeline
     */
    async evaluate(questionId, userAnswer, options = {}) {
        const { sessionId, userId, responseTimeMs, questionNumber, drawingData } = options;

        // Step 1: Fetch rubric
        const { question, rubric } = await this.fetchRubric(questionId);

        // Step 2: Normalize rubric points
        const rubricPoints = this.normalizeRubricPoints(rubric);

        // Step 3: Extract claims from user answer
        const { claims, wrongClaims, answerQuality } = await this.extractClaims(question, userAnswer, rubricPoints);

        // Step 4: Semantic matching
        const matchResults = await this.semanticMatch(claims, rubricPoints);

        // Step 4b: Check red flags
        const triggeredRedFlags = await this.checkRedFlags(wrongClaims, rubricPoints);

        // Step 5 & 6: Calculate score
        const scoreResult = this.calculateScore(matchResults, triggeredRedFlags, answerQuality);

        // Step 7: Generate feedback
        const feedback = await this.generateFeedback(question, userAnswer, scoreResult, matchResults, triggeredRedFlags);

        // Step 8: Determine next action
        const nextAction = this.determineNextAction(scoreResult, options.sessionState);

        // Step 9: Store evaluation (if sessionId provided)
        let storedEvent = null;
        if (sessionId) {
            storedEvent = await this.storeEvaluation(sessionId, questionId, {
                userAnswer,
                scoreResult,
                feedback,
                claims,
                wrongClaims,
                triggeredRedFlags,
                answerQuality,
                detailedMatches: matchResults.detailedMatches,
                responseTimeMs,
                questionNumber,
                drawingData,
            });
        }

        // Step 10: Update skill profile (if userId provided)
        let skillUpdate = null;
        if (userId) {
            try {
                skillUpdate = await this.updateSkillProfile(userId, question.domain, question.topic, scoreResult.finalScore);
            } catch (error) {
                console.warn('[HybridEval] Skill update failed (table may not exist):', error.message);
            }
        }

        return {
            score: scoreResult.finalScore,
            scoreBreakdown: scoreResult.breakdown,
            coverage: scoreResult.coverage,
            claims,
            wrongClaims,
            triggeredRedFlags,
            answerQuality,
            feedback,
            nextAction,
            skillUpdate,
            eventId: storedEvent?.id,
            question: {
                id: question.id,
                text: question.text,
                domain: question.domain,
                topic: question.topic,
            },
        };
    }
}

const hybridEvaluationService = new HybridEvaluationService();

module.exports = { HybridEvaluationService, hybridEvaluationService };
