// src/translations/translations.controller.ts
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TranslationsService } from './translations.service';
import { TranslateTextDto } from './dto/translate-text.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Role } from '../common/enums/role.enum';
import {
  BatchTranslationResultDto,
  TranslateBatchPhrasesDto,
} from './dto/translate-batch.dto';

@ApiTags('Translation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslationsController {
  constructor(private readonly translationService: TranslationsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get available translation providers' })
  @ApiResponse({
    status: 200,
    description: 'List of available translation providers',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              available: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  getAvailableProviders() {
    return {
      providers: this.translationService.getAvailableProviders(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Translate a text to target language' })
  @ApiBody({ type: TranslateTextDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully translated text',
    schema: {
      type: 'object',
      properties: {
        translatedText: { type: 'string' },
        provider: { type: 'string' },
        sourceText: { type: 'string' },
        sourceLanguage: { type: 'string' },
        targetLanguage: { type: 'string' },
      },
    },
  })
  async translateText(@Body() translateDto: TranslateTextDto): Promise<{
    translatedText: string;
    provider: string;
    sourceText: string;
    sourceLanguage: string;
    targetLanguage: string;
  }> {
    const result = await this.translationService.translateText(
      translateDto.text,
      translateDto.targetLanguage,
      translateDto.sourceLanguage,
      translateDto.provider,
    );

    return {
      translatedText: result.translatedText,
      provider: result.provider,
      sourceText: translateDto.text,
      sourceLanguage: translateDto.sourceLanguage || 'en-US',
      targetLanguage: translateDto.targetLanguage,
    };
  }

  @Post('phrases/batch')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.TRANSLATOR)
  @RequirePermission('canTranslate')
  @ApiOperation({ summary: 'Translate multiple phrases and save to database' })
  @ApiBody({ type: TranslateBatchPhrasesDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed batch translation',
    type: BatchTranslationResultDto,
  })
  async translateBatchPhrases(
    @Body() translateDto: TranslateBatchPhrasesDto,
  ): Promise<BatchTranslationResultDto> {
    return this.translationService.translateBatchPhrases(translateDto);
  }
}
