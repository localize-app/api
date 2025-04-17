import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/config.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { LocalesModule } from './locales/locales.module';
import { PhrasesModule } from './phrases/phrases.module';
// import { ActivitiesModule } from './activities/activities.module';
// import { IntegrationsModule } from './integrations/integrations.module';
import { StyleGuidesModule } from './style-guides/style-guides.module';
import { GlossaryTermsModule } from './glossary-terms/glossary-terms.module';

@Module({
  imports: [
    // Config module should be first to ensure environment variables are loaded
    AppConfigModule,

    // Use configuration service to get the MongoDB URI
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Add mongoose connection options for better error handling
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
    // Feature modules
    CompaniesModule,
    ProjectsModule,
    UsersModule,
    LocalesModule,
    PhrasesModule,
    // ActivitiesModule,
    // IntegrationsModule,
    StyleGuidesModule,
    GlossaryTermsModule,
  ],
  controllers: [],
  providers: [
    // Global JWT Authentication - applied to all routes except those marked with @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global exception filter for consistent error handling
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
