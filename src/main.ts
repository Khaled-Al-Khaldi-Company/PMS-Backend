import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so the React Frontend can communicate with the backend API
  app.enableCors();
  
  // Changed port from 3000 to 4000 to avoid conflicts with Next.js frontend
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
