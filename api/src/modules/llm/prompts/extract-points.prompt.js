/**
 * Prompt for extracting points from user answer
 */
const extractPointsPrompt = (question, answer, rubric) => `
You are evaluating an interview answer.

Question: ${question}

Expected points (rubric):
- Must-have: ${JSON.stringify(rubric.mustHave)}
- Good-to-have: ${JSON.stringify(rubric.goodToHave)}
- Red flags: ${JSON.stringify(rubric.redFlags)}

User's Answer:
${answer}

Analyze the answer and return JSON with:
- covered: list of must-have points that are correctly explained
- coveredGood: list of good-to-have points mentioned
- missing: list of must-have points NOT covered
- wrongClaims: list of red flags found in the answer
- confidence: 0-1 confidence in your evaluation

Be strict but fair. A point is "covered" if the concept is explained correctly, even if not using exact words.

Respond with ONLY valid JSON:
{
  "covered": [],
  "coveredGood": [],
  "missing": [],
  "wrongClaims": [],
  "confidence": 0.8
}
`;

module.exports = { extractPointsPrompt };
