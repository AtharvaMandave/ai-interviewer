/**
 * Prompt Templates for AI Interview Coach
 * 
 * These templates define structured prompts for various LLM tasks:
 * - Rubric generation for questions
 * - Answer point extraction
 * - Follow-up question generation
 */

// ============= SYSTEM PROMPTS =============

const SYSTEM_PROMPTS = {
  evaluator: `You are an expert technical interviewer evaluating candidate responses. 
You are fair, thorough, and provide constructive feedback.
You identify both strengths and areas for improvement.
You focus on technical accuracy, completeness, and clarity of explanation.`,

  interviewer: `You are an experienced technical interviewer conducting a practice interview.
You ask relevant follow-up questions based on the candidate's responses.
Your questions probe deeper understanding and identify knowledge gaps.
You are encouraging but rigorous in assessing technical depth.`,

  rubricGenerator: `You are a curriculum expert creating evaluation rubrics for technical interview questions.
You create comprehensive, fair, and measurable evaluation criteria.
Your rubrics help assess both breadth and depth of understanding.`,
};

// ============= RUBRIC GENERATION =============

/**
 * Generate prompt for rubric generation
 */
function generateRubricPrompt(question) {
  return {
    systemPrompt: SYSTEM_PROMPTS.rubricGenerator,
    prompt: `Create an evaluation rubric for this ${question.domain} interview question:

QUESTION: "${question.text}"
TOPIC: ${question.topic}
DIFFICULTY: ${question.difficulty}

Generate a rubric with:
1. mustHave (array of 4-6 essential points that MUST be covered for a good answer)
2. goodToHave (array of 2-4 bonus points that show deeper understanding)
3. redFlags (array of 2-3 common misconceptions or wrong answers to penalize)
4. keywords (array of 8-12 key technical terms expected in a good answer)

Each mustHave point should be a clear, specific concept (not vague).
Each point should be evaluatable - can we check if the answer covers it?

Respond with JSON only:
{
  "mustHave": ["point 1", "point 2", ...],
  "goodToHave": ["bonus 1", "bonus 2", ...],
  "redFlags": ["misconception 1", ...],
  "keywords": ["term1", "term2", ...]
}`,
  };
}

// ============= ANSWER EVALUATION =============

/**
 * Generate prompt for extracting covered points from an answer
 */
function generatePointExtractionPrompt(question, answer, rubric) {
  return {
    systemPrompt: SYSTEM_PROMPTS.evaluator,
    prompt: `Evaluate this candidate's answer against the rubric.

QUESTION: "${question.text}"
TOPIC: ${question.topic}
DIFFICULTY: ${question.difficulty}

CANDIDATE'S ANSWER:
"${answer}"

RUBRIC TO EVALUATE AGAINST:
Must-Have Points:
${rubric.mustHave.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Good-to-Have Points:
${rubric.goodToHave.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Red Flags to Check:
${rubric.redFlags.map((p, i) => `${i + 1}. ${p}`).join('\n')}

EVALUATION INSTRUCTIONS:
1. For each must-have point, determine if the answer adequately covers it
2. For each good-to-have point, check if it's mentioned
3. Identify any red flags present in the answer
4. Assess overall quality and confidence

Respond with JSON only:
{
  "coveredMustHave": [indices of covered must-have points, e.g., [0, 2, 3]],
  "coveredGoodToHave": [indices of covered good-to-have points],
  "triggeredRedFlags": [indices of triggered red flags],
  "confidence": 0.0-1.0 (how confident are you in this evaluation),
  "overallAssessment": "brief 1-2 sentence assessment",
  "suggestedScore": 0-100
}`,
  };
}

/**
 * Generate prompt for detailed feedback
 */
function generateFeedbackPrompt(question, answer, evaluation) {
  return {
    systemPrompt: SYSTEM_PROMPTS.evaluator,
    prompt: `Generate constructive feedback for this interview answer.

QUESTION: "${question.text}"
CANDIDATE'S ANSWER: "${answer}"

EVALUATION RESULTS:
- Points Covered: ${evaluation.pointsCovered.length}
- Points Missed: ${evaluation.pointsMissed.length}
- Red Flags: ${evaluation.redFlagsTriggered.length}
- Score: ${evaluation.score}/100

MISSED POINTS:
${evaluation.pointsMissed.map((p, i) => `- ${p}`).join('\n')}

Generate helpful, encouraging feedback that:
1. Acknowledges what was done well
2. Explains what key points were missed
3. Provides a specific suggestion for improvement
4. Keeps a professional, supportive tone

Respond with JSON:
{
  "summary": "1-2 sentence overall feedback",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "studyTip": "one actionable study recommendation"
}`,
  };
}

// ============= FOLLOW-UP QUESTION GENERATION =============

/**
 * Generate prompt for follow-up questions
 */
function generateFollowUpPrompt(question, answer, evaluation, depth = 1) {
  const depthGuidance = {
    1: 'Ask a clarifying question to probe understanding of a concept they mentioned.',
    2: 'Ask a deeper technical question about implementation details or edge cases.',
    3: 'Ask a challenging scenario-based question that tests practical application.',
  };

  return {
    systemPrompt: SYSTEM_PROMPTS.interviewer,
    prompt: `Generate a follow-up question for this interview.

ORIGINAL QUESTION: "${question.text}"
TOPIC: ${question.topic}

CANDIDATE'S ANSWER:
"${answer}"

EVALUATION:
- Score: ${evaluation.score}/100
- Points Covered: ${evaluation.pointsCovered.slice(0, 3).join(', ')}
- Points Missed: ${evaluation.pointsMissed.slice(0, 2).join(', ')}

FOLLOW-UP DEPTH: ${depth}/3
GUIDANCE: ${depthGuidance[depth] || depthGuidance[1]}

Generate ONE follow-up question that:
1. Naturally flows from their answer
2. Tests deeper understanding or addresses gaps
3. Is appropriately challenging for ${question.difficulty} difficulty
4. Focuses on practical application when possible

Respond with JSON:
{
  "followUpQuestion": "The follow-up question text",
  "intent": "What this question aims to assess",
  "expectedTopics": ["topic1", "topic2"],
  "difficulty": "Easy/Medium/Hard"
}`,
  };
}

// ============= SEMANTIC MATCHING =============

/**
 * Generate prompt for semantic matching of answer to rubric points
 */
function generateSemanticMatchPrompt(answerSegment, rubricPoints) {
  return {
    systemPrompt: SYSTEM_PROMPTS.evaluator,
    prompt: `Determine which rubric points are covered by this answer segment.

ANSWER SEGMENT:
"${answerSegment}"

RUBRIC POINTS:
${rubricPoints.map((p, i) => `[${i}] ${p}`).join('\n')}

For each rubric point, determine if the answer segment adequately covers it.
A point is "covered" if the answer demonstrates understanding of that concept,
even if using different words.

Respond with JSON:
{
  "matches": [
    {"pointIndex": 0, "covered": true/false, "confidence": 0.0-1.0},
    {"pointIndex": 1, "covered": true/false, "confidence": 0.0-1.0},
    ...
  ]
}`,
  };
}

// ============= ROADMAP GENERATION =============

/**
 * Generate prompt for personalized study roadmap
 */
function generateRoadmapPrompt(userProfile) {
  return {
    systemPrompt: `You are an expert technical career coach creating personalized study plans.
You understand interview preparation and create practical, achievable roadmaps.`,
    prompt: `Create a personalized 4-week study roadmap based on this user's performance.

USER PROFILE:
- Overall Score: ${userProfile.overallScore}/100
- Total Sessions: ${userProfile.totalSessions}
- Questions Attempted: ${userProfile.questionsAttempted}

WEAK AREAS (need improvement):
${userProfile.weakTopics.map(t => `- ${t.domain}/${t.topic}: ${t.score}%`).join('\n')}

STRONG AREAS:
${userProfile.strongTopics.map(t => `- ${t.domain}/${t.topic}: ${t.score}%`).join('\n')}

COMMON MISTAKES:
${userProfile.mistakePatterns.map(m => `- ${m}`).join('\n')}

Create a 4-week roadmap that:
1. Prioritizes weak areas while maintaining strengths
2. Has specific daily/weekly goals
3. Includes recommended resources
4. Builds complexity progressively

Respond with JSON:
{
  "title": "Personalized roadmap title",
  "weeklyPlan": {
    "week1": {
      "focus": "Main focus area",
      "topics": ["topic1", "topic2"],
      "goals": ["goal1", "goal2"],
      "practiceQuestions": 10
    },
    "week2": {...},
    "week3": {...},
    "week4": {...}
  },
  "resources": [
    {"topic": "topic", "title": "Resource name", "type": "article/video/practice", "url": "optional"}
  ],
  "milestones": ["milestone1", "milestone2", "milestone3"]
}`,
  };
}

// ============= INTERVIEWER COMMENTARY =============

/**
 * Generate prompt for natural interviewer commentary after an answer
 */
function generateInterviewerCommentary(question, answer, evaluation, feedback) {
  return {
    systemPrompt: `You are a senior technical interviewer at a top tech company conducting a live interview. 
You speak naturally, conversationally, and professionally — like a real human interviewer would.
You are warm but rigorous. You never say "Great job!" generically — you reference specifics from the answer.
Keep responses concise (2-4 sentences). Do NOT repeat the score or list points — the UI shows those separately.`,
    prompt: `You just heard a candidate's answer. Respond naturally as an interviewer would in a real interview.

QUESTION YOU ASKED: "${question.text}"
TOPIC: ${question.topic}

CANDIDATE'S ANSWER (summary):
"${answer.substring(0, 600)}"

EVALUATION RESULTS (for your reference only — do NOT quote these directly):
- Score: ${evaluation.score || evaluation.finalScore || 'N/A'}/10
- Strengths: ${(feedback?.didWell || feedback?.strengths || []).slice(0, 2).join(', ') || 'None noted'}
- Gaps: ${(feedback?.needsImprovement || feedback?.improvements || []).slice(0, 2).join(', ') || 'None noted'}

${evaluation.score >= 7 ? 'The answer was strong. Acknowledge what impressed you specifically, then transition naturally.' : ''}
${evaluation.score >= 4 && evaluation.score < 7 ? 'The answer was partial. Acknowledge what was good, gently note what was missing, and encourage.' : ''}
${evaluation.score < 4 ? 'The answer missed key concepts. Be kind but honest. Briefly explain what you were looking for.' : ''}

Respond with JSON:
{
  "message": "Your natural interviewer response (2-4 sentences, conversational)",
  "tone": "encouraging|neutral|probing",
  "shouldFollowUp": ${evaluation.score < 6 ? 'true' : 'false'}
}`
  };
}

// ============= CLARIFICATION RESPONSE =============

/**
 * Generate prompt for answering candidate's mid-question doubts
 */
function generateClarificationResponse(question, doubt) {
  return {
    systemPrompt: `You are a senior technical interviewer. A candidate has a doubt about the question you asked.
Respond like a real interviewer would: clarify the question, provide context, or rephrase — but NEVER give away the answer.
Be helpful and conversational. Keep it to 1-3 sentences.`,
    prompt: `The candidate has a doubt while answering your interview question.

YOUR QUESTION: "${question.text}"
TOPIC: ${question.topic}
DIFFICULTY: ${question.difficulty}

CANDIDATE'S DOUBT: "${doubt}"

Respond naturally as an interviewer would. You can:
- Rephrase the question if they're confused
- Clarify scope ("I'm looking for..." or "Think about it in terms of...")
- Give a gentle nudge without revealing the answer
- Confirm if their understanding of the question is correct

Respond with JSON:
{
  "message": "Your clarification response (1-3 sentences)",
  "rephrased": "Optional: a clearer version of the question, or null if not needed"
}`
  };
}

module.exports = {
  SYSTEM_PROMPTS,
  generateRubricPrompt,
  generatePointExtractionPrompt,
  generateFeedbackPrompt,
  generateFollowUpPrompt,
  generateSemanticMatchPrompt,
  generateRoadmapPrompt,
  generateInterviewerCommentary,
  generateClarificationResponse,
};
