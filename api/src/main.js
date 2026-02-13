const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('./app.module');
const { HttpExceptionFilter } = require('./common/filters/http-exception.filter');
const { LoggingInterceptor } = require('./common/interceptors/logging.interceptor');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  if (process.env.NODE_ENV === 'development') {
    app.useGlobalInterceptors(new LoggingInterceptor());
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
    🚀 AI Interview Coach API is running!
    📍 Local:    http://localhost:${port}/api
    📍 Health:   http://localhost:${port}/api/health
    🔧 Mode:     ${process.env.NODE_ENV || 'development'}
  `);
}

bootstrap();
