// src/translations/translations.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';
import { TranslationFactoryService } from './translation-factory.service';
import { LibreTranslateProvider } from './providers/libre-translate.provider';
import { MyMemoryProvider } from './providers/mymemory.provider';
import { GoogleTranslateProvider } from './providers/google-translate.provider';
import { Phrase, PhraseSchema } from 'src/phrases/entities/phrase.entity';
import { PhrasesService } from 'src/phrases/phrases.service';
import { Project, ProjectSchema } from 'src/projects/entities/project.entity';
import { PhrasesModule } from 'src/phrases/phrases.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { ProjectsService } from 'src/projects/projects.service';
import { CacheModule } from 'src/cache/cache.module'; // Import CacheModule
import { LabelsModule } from 'src/labels/labels.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Phrase.name, schema: PhraseSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    ConfigModule,
    CacheModule, // Add CacheModule
    PhrasesModule,
    ProjectsModule,
    LabelsModule,
  ],
  controllers: [TranslationsController],
  providers: [
    PhrasesService,
    TranslationsService,
    TranslationFactoryService,
    LibreTranslateProvider,
    MyMemoryProvider,
    GoogleTranslateProvider,
    ProjectsService,
  ],
  exports: [TranslationsService, TranslationFactoryService],
})
export class TranslationsModule {}
