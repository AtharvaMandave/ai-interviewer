# AI Interview Coach Agent - Backend API

A sophisticated AI-powered interview preparation system built with NestJS, Prisma, and multiple LLM providers.

## 🎯 Overview

The AI Interview Coach Agent is an intelligent system designed to help candidates prepare for technical interviews through:

- **Adaptive questioning** - Adjusts difficulty based on performance
- **Rubric-based evaluation** - Deterministic scoring with LLM-enhanced feedback
- **Smart follow-ups** - Targets weak areas and misconceptions
- **Personalized roadmaps** - AI-generated study plans
- **Progress tracking** - Skill profiles and mistake pattern detection

## 🏗️ Architecture

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                             │
│  (Routes flow, coordinates agents, manages session state)    │
└──────────┬───────────────┬───────────────┬─────────────────┘
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │INTERVIEWER│    │EVALUATOR │    │ ANALYST  │
    │           │    │          │    │          │
    │- Question │    │- Score   │    │- Pattern │
    │  selection│    │  answer  │    │  detect  │
    │- Follow-up│    │- Rubric  │    │- Roadmap │
    │  generation│   │  matching│    │  generate│
    └──────────┘    └──────────┘    └──────────┘
           │               │               │
           └───────────────┴───────────────┘
                           │
                    ┌──────▼──────┐
                    │POLICY ENGINE│
                    │(Deterministic│
                    │ rules)       │
                    └─────────────┘
```

### Module Structure

```
api/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/                # Configuration
│   ├── common/                # Shared utilities
│   │   ├── decorators/        # Custom decorators
│   │   ├── guards/            # Auth guards
│   │   ├── filters/           # Exception filters
│   │   ├── interceptors/      # Request interceptors
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Utility functions
│   │   └── types/             # Type definitions
│   ├── prisma/                # Database service
│   ├── modules/
│   │   ├── auth/              # OAuth authentication
│   │   ├── users/             # User management
│   │   ├── health/            # Health checks
│   │   ├── question-bank/     # Question management
│   │   ├── session/           # Interview sessions
│   │   ├── rubric/            # Rubric management
│   │   ├── agent/             # Core AI agents
│   │   ├── evaluation/        # Answer evaluation
│   │   ├── llm/               # LLM providers
│   │   ├── memory/            # Redis + Vector DB
│   │   ├── analytics/         # Skill tracking
│   │   ├── queue/             # Background jobs
│   │   └── reports/           # Session reports
│   └── workers/               # Job workers
├── .env                       # Environment variables
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for Phase 2+)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/interview_coach?schema=public"

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# LLM Providers
GROQ_API_KEY=your-groq-key
OPENAI_API_KEY=your-openai-key
LLM_PROVIDER=groq

# Server
PORT=3001
NODE_ENV=development
```

## 📚 API Endpoints

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/session/start` | Start new interview |
| POST | `/api/session/next-question` | Get next question |
| POST | `/api/session/submit-answer` | Submit answer |
| POST | `/api/session/end` | End session |
| GET | `/api/session/:id` | Get session details |
| GET | `/api/session/user/history` | Get user history |

### Request/Response Examples

**Start Session:**
```json
POST /api/session/start
{
  "domain": "Java",
  "mode": "Practice",
  "difficulty": "Medium"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "domain": "Java",
    "mode": "Practice",
    "difficulty": "Medium"
  }
}
```

**Submit Answer:**
```json
POST /api/session/submit-answer
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "answer": "HashMap uses hashing mechanism...",
  "responseTimeMs": 45000
}

Response:
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "score": 7.5,
    "grade": "B+",
    "feedback": "Good explanation of hashing..."
  }
}
```

## 🧠 Scoring Formula

Deterministic scoring for reproducibility:

```javascript
mustScore  = (coveredMust / totalMust) × 6
bonusScore = (coveredGood / totalGood) × 3
penalty    = wrongClaimsCount × 1.5
finalScore = clamp(mustScore + bonusScore - penalty, 0, 10)
```

## 🔧 Configuration

### Policy Engine Thresholds

```javascript
{
  MAX_QUESTIONS: 10,
  MAX_FOLLOW_UP_DEPTH: 2,
  FOLLOW_UP_THRESHOLD: 4,    // Score below triggers follow-up
  DIFFICULTY_UP_THRESHOLD: 8  // Score above increases difficulty
}
```

### LLM Provider Setup

The system supports multiple LLM providers with automatic fallback:

1. **Primary**: Groq (llama-3.1-70b-versatile)
2. **Fallback**: OpenAI (gpt-4o-mini)
3. **Embeddings**: OpenAI (text-embedding-3-small)

## 📊 Database Schema

See `prisma/schema.prisma` for the complete schema including:

- **User** - Authentication and profiles
- **Question** - Interview questions with metadata
- **Rubric** - Scoring criteria (mustHave, goodToHave, redFlags)
- **Session** - Interview session tracking
- **SessionEvent** - Individual Q&A pairs
- **SkillProfile** - Topic mastery tracking
- **MistakePattern** - Common error detection
- **Report** - Session summaries
- **Roadmap** - Personalized study plans

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📈 Implementation Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Core Session Flow | ✅ Complete |
| 2 | Redis Session State | 🔲 Placeholder |
| 3 | LLM Evaluation | ✅ Complete |
| 4 | Skill Tracking | ✅ Complete |
| 5 | Pattern Detection | ✅ Complete |
| 6 | Vector Memory | 🔲 Placeholder |
| 7 | Background Jobs | 🔲 Placeholder |
| 8 | OAuth | 🔲 Placeholder |
| 9 | Reports & Roadmaps | ✅ Complete |

## 📝 License

UNLICENSED - Private project

## 🤝 Contributing

This is a private project. Contact the maintainer for contribution guidelines.
