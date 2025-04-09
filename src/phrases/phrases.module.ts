import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhrasesService } from './phrases.service';
import { PhrasesController } from './phrases.controller';
import { Phrase, PhraseSchema } from './entities/phrase.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Phrase.name, schema: PhraseSchema }]),
  ],
  controllers: [PhrasesController],
  providers: [PhrasesService],
  exports: [PhrasesService],
})
export class PhrasesModule {}
