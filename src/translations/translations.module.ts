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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Phrase.name, schema: PhraseSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    ConfigModule,
    PhrasesModule, // Import the entire PhrasesModule
    ProjectsModule, // If you need ProjectKeyGuard
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
    // ProjectP
    // ProjectKeyGuard,
  ],
  exports: [TranslationsService, TranslationFactoryService],
})
export class TranslationsModule {}
