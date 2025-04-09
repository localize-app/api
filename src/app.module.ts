import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { LocalesModule } from './locales/locales.module';
import { PhrasesModule } from './phrases/phrases.module';
import { ActivitiesModule } from './activities/activities.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { StyleGuidesModule } from './style-guides/style-guides.module';
import { GlossaryTermsModule } from './glossary-terms/glossary-terms.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'),
    CompaniesModule,
    ProjectsModule,
    UsersModule,
    LocalesModule,
    PhrasesModule,
    ActivitiesModule,
    IntegrationsModule,
    StyleGuidesModule,
    GlossaryTermsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
