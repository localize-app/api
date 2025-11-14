// import * as fs from 'fs';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // CRITICAL: Cookie parser middleware for httpOnly cookies
  app.use(cookieParser());

  // Set up global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // SECURITY: Enable CORS with strict configuration
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:4173', // Vite preview
        'http://localhost:3000', // If frontend is on 3000
      ]; // Default dev origins

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
      'x-project-key',
    ],
    credentials: true, // Required for httpOnly cookies
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Localize API')
    .setDescription('API documentation for Localize platform')
    .setVersion('1.0')
    .addTag('Companies')
    .addTag('Projects')
    .addTag('Users')
    .addTag('Phrases')
    .addTag('Locales')
    .addTag('GlossaryTerms')
    .addTag('Activities')
    .addTag('Authentication')
    .addBearerAuth() // Add Bearer Auth to Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Save OpenAPI document as JSON
  // fs.writeFileSync('./openapi-spec.json', JSON.stringify(document, null, 2));

  // Get port from environment variables
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
