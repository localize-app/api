import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';
import { TranslationFactoryService } from './translation-factory.service';
import { LibreTranslateProvider } from './providers/libre-translate.provider';
import { MyMemoryProvider } from './providers/mymemory.provider';
import { GoogleTranslateProvider } from './providers/google-translate.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { Phrase, PhraseSchema } from 'src/phrases/entities/phrase.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Phrase.name, schema: PhraseSchema }]),

    ConfigModule,
  ],
  controllers: [TranslationsController],
  providers: [
    TranslationsService,
    TranslationFactoryService,
    LibreTranslateProvider,
    MyMemoryProvider,
    GoogleTranslateProvider,
  ],
  exports: [TranslationsService, TranslationFactoryService],
})
export class TranslationsModule {}
