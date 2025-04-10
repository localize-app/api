import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set up global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Enable CORS
  app.enableCors({ exposedHeaders: 'Content-Range' });

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
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
