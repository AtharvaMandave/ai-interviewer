const { Module, MiddlewareConsumer } = require('@nestjs/common');
const { ConfigModule } = require('@nestjs/config');
const { AppController } = require('./app.controller');
const { AppService } = require('./app.service');

// Core modules
const { PrismaModule } = require('./prisma/prisma.module');

// Feature modules
const { HealthModule } = require('./modules/health/health.module');
const { AuthModule } = require('./modules/auth/auth.module');
const { UsersModule } = require('./modules/users/users.module');
const { QuestionBankModule } = require('./modules/question-bank/question-bank.module');
const { SessionModule } = require('./modules/session/session.module');
const { RubricModule } = require('./modules/rubric/rubric.module');
const { AgentModule } = require('./modules/agent/agent.module');
const { EvaluationModule } = require('./modules/evaluation/evaluation.module');
const { LLMModule } = require('./modules/llm/llm.module');
const { MemoryModule } = require('./modules/memory/memory.module');
const { AnalyticsModule } = require('./modules/analytics/analytics.module');
const { QueueModule } = require('./modules/queue/queue.module');
const { ReportsModule } = require('./modules/reports/reports.module');

// Middleware
const { RequestIdMiddleware } = require('./common/middleware/request-id.middleware');

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core
    PrismaModule,

    // Features
    HealthModule,
    AuthModule,
    UsersModule,
    QuestionBankModule,
    SessionModule,
    RubricModule,
    AgentModule,
    EvaluationModule,
    LLMModule,
    MemoryModule,
    AnalyticsModule,
    QueueModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
class AppModule {
  configure(consumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

module.exports = { AppModule };
