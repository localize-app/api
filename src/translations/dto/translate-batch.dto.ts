// src/translations/dto/translate-batch-phrases.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsBoolean,
} from 'class-validator';

export class TranslateBatchPhrasesDto {
  @ApiProperty({
    description: 'Array of phrase IDs to translate',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  phraseIds: string[];

  @ApiProperty({
    description: 'Target language code or locale',
    example: 'fr-FR',
  })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiProperty({
    description: 'Source language code or locale',
    example: 'en-US',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceLanguage?: string = 'en-US';

  // Provider is automatically selected by backend

  @ApiProperty({
    description: 'Auto-approve translations (skip review)',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean = false;

  @ApiProperty({
    description: 'Overwrite existing translations',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  overwriteExisting?: boolean = false;
}

// Response DTO
export class BatchTranslationResultDto {
  @ApiProperty({
    description: 'Total phrases processed',
    example: 10,
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Number of successful translations',
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: 'Number of failed translations',
    example: 2,
  })
  failureCount: number;

  @ApiProperty({
    description: 'Number of skipped phrases (already translated)',
    example: 1,
  })
  skippedCount: number;

  @ApiProperty({
    description: 'Translation provider used',
    example: 'MyMemory',
  })
  provider: string;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 5230,
  })
  processingTimeMs: number;

  @ApiProperty({
    description: 'Detailed results for each phrase',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        phraseId: { type: 'string' },
        sourceText: { type: 'string' },
        translatedText: { type: 'string' },
        status: { type: 'string', enum: ['success', 'failed', 'skipped'] },
        error: { type: 'string' },
      },
    },
  })
  results: Array<{
    phraseId: string;
    sourceText: string;
    translatedText?: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
  }>;
}
