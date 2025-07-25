// import { Throttle } from '@nestjs/throttler';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiHeader,
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
import { PhrasesService } from 'src/phrases/phrases.service';
import { Public } from 'src/auth/decorators/public.decorator';
import {
  InstantTranslateDto,
  InstantTranslateResponseDto,
} from './dto/instant-translate.dto';
import { ProjectsService } from 'src/projects/projects.service';
import { RateLimit, RateLimitGuard } from 'src/common/guards/rate-limit.guard';

@ApiTags('Translation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translate')
export class TranslationsController {
  constructor(
    private readonly translationService: TranslationsService,
    private readonly phrasesService: PhrasesService,
    private readonly projectsService: ProjectsService,
  ) {}

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

  @Public()
  @Get(':projectKey/:langCode')
  @ApiOperation({ summary: 'Get all translations for a project and language' })
  @ApiParam({ name: 'projectKey', description: 'Project key' })
  @ApiParam({ name: 'langCode', description: 'Language code' })
  @ApiHeader({
    name: 'X-Project-Key',
    description: 'Project key for authentication',
    required: false, // Optional since it can also come from URL
  })
  @ApiResponse({
    status: 200,
    description: 'Returns translations map',
    schema: {
      type: 'object',
      properties: {
        translations: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
    },
  })
  async getTranslationsForLanguage(
    @Param('projectKey') projectKey: string,
    @Param('langCode') langCode: string,
  ) {
    return this.phrasesService.getTranslationsForLanguage(projectKey, langCode);
  }

  @Post('instant')
  @Public() // Make it public like batch-extract endpoint
  @UseGuards(RateLimitGuard) // Apply rate limiting
  @RateLimit({
    points: 100, // 100 requests
    duration: 60, // per minute
    keyPrefix: 'instant-translate',
  })
  @ApiOperation({
    summary: 'Instant translation for UI elements',
    description:
      'Translate multiple texts instantly for elements with instant-translation class. Results are cached for performance.',
  })
  @ApiHeader({
    name: 'X-Project-Key',
    description: 'Project key for authentication',
    required: true,
  })
  @ApiBody({ type: InstantTranslateDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully translated texts',
    type: InstantTranslateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid project key',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'Too many requests' },
        error: { type: 'string', example: 'Rate limit exceeded' },
        retryAfter: { type: 'number', example: 60 },
      },
    },
  })
  async instantTranslate(
    @Body() instantTranslateDto: InstantTranslateDto,
    @Headers('x-project-key') projectKey: string,
  ): Promise<InstantTranslateResponseDto> {
    // Validate project key
    const project = await this.projectsService.findByKey(projectKey);
    if (!project) {
      throw new UnauthorizedException('Invalid project key');
    }

    // Call the service method
    const result = await this.translationService.instantTranslate(
      instantTranslateDto,
      project._id.toString(),
    );

    return result;
  }
}
