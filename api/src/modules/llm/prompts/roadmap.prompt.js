/**
 * Prompt for generating study roadmap
 */
const roadmapPrompt = (weakTopics, mistakePatterns, domain) => `
You are creating a personalized study roadmap for a student preparing for ${domain} interviews.

Weak Areas:
${weakTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Common Mistakes:
${mistakePatterns.map((m, i) => `${i + 1}. ${m.description}`).join('\n')}

Create a 4-week study plan with:
- Week 1-2: Address fundamentals and weak areas
- Week 3: Focus on common mistakes and edge cases
- Week 4: Mock interviews and revision

For each week, provide:
- Focus topics
- Daily goals (2-3 items)
- Practice recommendations

Respond with JSON:
{
  "week1": {
    "focus": ["topic1", "topic2"],
    "goals": ["goal1", "goal2", "goal3"],
    "practice": "recommendation"
  },
  "week2": { ... },
  "week3": { ... },
  "week4": { ... }
}
`;

module.exports = { roadmapPrompt };
