/**
 * Prompt for generating rubric from question
 */
const rubricPrompt = (question, domain) => `
You are an expert technical interviewer for ${domain}.

Given the following interview question, generate a comprehensive rubric for evaluating answers.

Question: ${question}

Generate a JSON rubric with:
- mustHave: 3-8 core concepts that MUST be mentioned (essential for a correct answer)
- goodToHave: 0-6 advanced concepts that show deeper understanding
- redFlags: 0-8 common misconceptions or incorrect statements

Rules:
- Each point should be a short phrase (max 10 words)
- Must-have points should be fundamental concepts
- Good-to-have should be advanced/bonus knowledge
- Red flags should be common mistakes or misconceptions

Respond with ONLY valid JSON:
{
  "mustHave": ["point1", "point2", ...],
  "goodToHave": ["point1", ...],
  "redFlags": ["misconception1", ...]
}
`;

module.exports = { rubricPrompt };
