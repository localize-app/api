// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { TenantMiddleware } from './auth/middleware/tenant.middleware';
import { CacheModule } from './cache/cache.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { PhrasesModule } from './phrases/phrases.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthorizationGuard } from './auth/guards/auth.guard';
import { TranslationsModule } from './translations/translations.module';
import { ActivitiesModule } from './activities/activities.module';
import { AppConfigModule } from './config/config.module';
import { GlossaryTermsModule } from './glossary-terms/glossary-terms.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { LocalesModule } from './locales/locales.module';
import { StyleGuidesModule } from './style-guides/style-guides.module';
import { LabelsModule } from './labels/labels.module';
import { HealthModule } from './health/health.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

@Module({
  imports: [
    // Config module from NestJS for environment variables
    ConfigModule.forRoot({ isGlobal: true }),

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
    PhrasesModule,
    DashboardModule,
    TranslationsModule,
    ActivitiesModule,
    AppConfigModule,
    GlossaryTermsModule,
    IntegrationsModule,
    LocalesModule,
    StyleGuidesModule,
    LabelsModule,
    HealthModule,
    InvitationsModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
