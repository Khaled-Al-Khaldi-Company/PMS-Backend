import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS - in production allow only the frontend URL
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : true; // Allow all in development

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Use PORT from environment (Render sets this automatically)
  await app.listen(process.env.PORT ?? 4000);
  console.log(`🚀 PMS ERP Backend running on port ${process.env.PORT ?? 4000}`);
}
bootstrap();
