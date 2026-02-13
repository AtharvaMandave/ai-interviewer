/**
 * Seed Questions - HR Domain
 * 10 behavioral and situational questions
 */

const hrQuestions = [
    {
        domain: 'HR',
        topic: 'hr.introduction',
        difficulty: 'Easy',
        text: 'Tell me about yourself.',
        tags: ['introduction', 'self-presentation'],
        hints: ['Structure your answer', 'Relevant background'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Brief professional background',
                'Key skills and experiences',
                'Why interested in this role',
                'Structured response (not rambling)',
            ],
            goodToHave: ['Quantifiable achievements', 'Personal interests briefly'],
            redFlags: ['Too personal details', 'Negative about past employers'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.strengths',
        difficulty: 'Easy',
        text: 'What are your strengths and weaknesses?',
        tags: ['self-assessment', 'honesty'],
        hints: ['Relevant strengths', 'Growth-oriented weakness'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Specific strength with example',
                'Relevant to job role',
                'Genuine weakness, not cliche',
                'Steps taken to improve weakness',
            ],
            goodToHave: ['Multiple strengths', 'Self-awareness'],
            redFlags: ['Perfectionist as weakness', 'Arrogant tone'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.motivation',
        difficulty: 'Easy',
        text: 'Why do you want to work for this company?',
        tags: ['motivation', 'company-research'],
        hints: ['Research the company', 'Align with your goals'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Knowledge about company',
                'Alignment with company values',
                'Career growth perspective',
                'Genuine interest shown',
            ],
            goodToHave: ['Specific products/projects mentioned', 'Industry passion'],
            redFlags: ['Only mentions salary', 'Generic answer'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.conflict',
        difficulty: 'Medium',
        text: 'Describe a conflict with a coworker and how you resolved it.',
        tags: ['conflict-resolution', 'teamwork'],
        hints: ['STAR method', 'Focus on resolution'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Specific situation described',
                'Your actions to resolve',
                'Positive outcome',
                'Lesson learned',
            ],
            goodToHave: ['STAR format', 'Empathy shown'],
            redFlags: ['Blaming the other person', 'Unresolved conflict'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.leadership',
        difficulty: 'Medium',
        text: 'Tell me about a time you showed leadership.',
        tags: ['leadership', 'initiative'],
        hints: ['Project or team example', 'Impact made'],
        companyTags: ['Amazon', 'Google', 'Microsoft'],
        rubric: {
            mustHave: [
                'Clear leadership situation',
                'Actions you took',
                'Team impact',
                'Measurable result if possible',
            ],
            goodToHave: ['Challenges faced', 'Growth from experience'],
            redFlags: ['Taking all credit', 'No specific example'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.failure',
        difficulty: 'Medium',
        text: 'Tell me about a time you failed and what you learned.',
        tags: ['failure', 'learning', 'growth'],
        hints: ['Be honest', 'Focus on learning'],
        companyTags: ['Amazon', 'Google'],
        rubric: {
            mustHave: [
                'Genuine failure described',
                'Ownership of mistake',
                'Specific learnings',
                'How you applied the learning',
            ],
            goodToHave: ['Growth mindset', 'Prevented future issues'],
            redFlags: ['No real failure', 'Blaming others'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.goals',
        difficulty: 'Easy',
        text: 'Where do you see yourself in 5 years?',
        tags: ['career-goals', 'planning'],
        hints: ['Realistic goals', 'Aligned with role'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Clear career direction',
                'Growth within company/industry',
                'Skill development goals',
                'Ambition balanced with realism',
            ],
            goodToHave: ['Specific skills to develop'],
            redFlags: ['Planning to leave soon', 'No clear direction'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.pressure',
        difficulty: 'Medium',
        text: 'How do you handle pressure and tight deadlines?',
        tags: ['stress-management', 'time-management'],
        hints: ['Specific strategies', 'Real example'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Specific coping strategies',
                'Prioritization approach',
                'Example situation',
                'Positive outcome',
            ],
            goodToHave: ['Proactive communication', 'Work-life balance'],
            redFlags: ['I work well under pressure (without example)'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.teamwork',
        difficulty: 'Easy',
        text: 'Describe your experience working in a team.',
        tags: ['teamwork', 'collaboration'],
        hints: ['Role in team', 'Contribution'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'Specific team experience',
                'Your role and contribution',
                'Collaboration approach',
                'Team success',
            ],
            goodToHave: ['Diverse team experience', 'Remote collaboration'],
            redFlags: ['Prefer working alone', 'Taking all credit'],
        },
    },
    {
        domain: 'HR',
        topic: 'hr.questions',
        difficulty: 'Easy',
        text: 'Do you have any questions for us?',
        tags: ['questions', 'engagement'],
        hints: ['Prepare thoughtful questions', 'Show interest'],
        companyTags: ['All companies'],
        rubric: {
            mustHave: [
                'At least 2-3 questions prepared',
                'Questions about role/team',
                'Growth opportunities inquiry',
                'Genuine curiosity shown',
            ],
            goodToHave: ['Company culture questions', 'Next steps inquiry'],
            redFlags: ['No questions', 'Only salary/benefits questions'],
        },
    },
];

module.exports = { hrQuestions };
