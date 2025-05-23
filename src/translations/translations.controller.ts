import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranslationsService } from './translations.service';
import { TranslateTextDto } from './dto/translate-text.dto';
import { TranslateBatchDto } from './dto/translate-batch.dto';

@ApiTags('Translation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslationsController {
  constructor(private readonly translationService: TranslationsService) {}

  @Post()
  @ApiOperation({ summary: 'Translate a text to target language' })
  @ApiBody({ type: TranslateTextDto })
  async translateText(
    @Body() translateDto: TranslateTextDto,
  ): Promise<{ translatedText: string }> {
    const translatedText = await this.translationService.translateText(
      translateDto.text,
      translateDto.targetLanguage,
      translateDto.sourceLanguage,
    );
    return { translatedText };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Translate multiple texts to target language' })
  @ApiBody({ type: TranslateBatchDto })
  async translateBatch(
    @Body() translateDto: TranslateBatchDto,
  ): Promise<{ translatedTexts: string[] }> {
    const translatedTexts = await this.translationService.translateBatch(
      translateDto.texts,
      translateDto.targetLanguage,
      translateDto.sourceLanguage,
    );
    return { translatedTexts };
  }
}
