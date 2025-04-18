// import * as fs from 'fs';
import helmet from 'helmet';
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

  // Set up global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    exposedHeaders: ['Content-Range', 'Content-Disposition'],
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
