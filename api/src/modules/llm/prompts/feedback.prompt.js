/**
 * Prompt for generating feedback
 */
const feedbackPrompt = (question, answer, evaluation) => `
You are a helpful interview coach providing feedback.

Question: ${question}

User's Answer: ${answer}

Evaluation:
- Score: ${evaluation.score}/10
- Covered: ${evaluation.covered.join(', ')}
- Missing: ${evaluation.missing.join(', ')}
- Wrong claims: ${evaluation.wrongClaims.join(', ')}

Generate constructive, encouraging feedback that:
1. Acknowledges what was done well
2. Explains what was missing and why it matters
3. Provides specific suggestions for improvement
4. Keeps a supportive tone

Respond with 2-4 sentences of feedback.
`;

module.exports = { feedbackPrompt };
