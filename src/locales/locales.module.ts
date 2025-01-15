import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LocalesService } from './locales.service';
import { LocalesController } from './locales.controller';
import { Locale, LocaleSchema } from './entities/locale.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Locale.name, schema: LocaleSchema }]),
  ],
  controllers: [LocalesController],
  providers: [LocalesService],
})
export class LocalesModule {}
