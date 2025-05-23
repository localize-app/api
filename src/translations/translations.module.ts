import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';

@Module({
  imports: [ConfigModule],
  controllers: [TranslationsController],
  providers: [TranslationsService],
  exports: [TranslationsService],
})
export class TranslationsModule {}
