// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { CacheModule } from './cache/cache.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { LocalesModule } from './locales/locales.module';
import { PhrasesModule } from './phrases/phrases.module';
import { ActivitiesModule } from './activities/activities.module';
import { StyleGuidesModule } from './style-guides/style-guides.module';
import { GlossaryTermsModule } from './glossary-terms/glossary-terms.module';
import { AuthorizationGuard } from './auth/guards/auth.guard';
import { TranslationsModule } from './translations/translations.module';

@Module({
  imports: [
    // Config module should be first to ensure environment variables are loaded
    AppConfigModule,

    // Cache module - available globally
    CacheModule,

    // Use configuration service to get the MongoDB URI
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          connection.on('error', (error: any) => {
            console.error('MongoDB connection error:', error);
          });
          connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
          });
          connection.on('reconnected', () => {
            console.info('MongoDB reconnected successfully');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    CompaniesModule,
    ProjectsModule,
    UsersModule,
    LocalesModule,
    PhrasesModule,
    ActivitiesModule,
    StyleGuidesModule,
    GlossaryTermsModule,
    TranslationsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
