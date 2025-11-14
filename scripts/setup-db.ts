#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SetupModule } from '../src/setup/setup.module';
import { SetupService } from '../src/setup/setup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/interval-locale',
      }),
      inject: [ConfigService],
    }),
    SetupModule,
  ],
})
class SetupAppModule {}

async function bootstrap() {
  console.log('🚀 Starting database setup...');

  const app = await NestFactory.createApplicationContext(SetupAppModule);
  const setupService = app.get(SetupService);

  try {
    const command = process.argv[2];

    if (command === 'reset') {
      await setupService.resetDatabase();
    } else {
      await setupService.setupDatabase();
    }

    console.log('✅ Setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
