import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // Allow all origins for now to avoid Vercel alias blocking
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Use PORT from environment (Render sets this automatically)
  await app.listen(process.env.PORT ?? 4000);
  console.log(`🚀 PMS ERP Backend running on port ${process.env.PORT ?? 4000}`);
}
bootstrap();
