import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: '*', // For local testing and ease of evaluation
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend server successfully running on http://localhost:3000`);
}
bootstrap();

