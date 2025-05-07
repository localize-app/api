import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { PhrasesController } from './phrases.controller';
import { PhrasesService } from './phrases.service';
import { Phrase, PhraseSchema } from './entities/phrase.entity';
import { Project, ProjectSchema } from '../projects/entities/project.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Phrase.name, schema: PhraseSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  ],
  controllers: [PhrasesController],
  providers: [PhrasesService],
  exports: [PhrasesService],
})
export class PhrasesModule {}
