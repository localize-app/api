import {
  IsOptional,
  IsString,
  IsMongoId,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UpdateTranslationDto {
  @ApiProperty({ description: 'Translation text', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({
    description: 'Translation status',
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    required: false,
  })
  @IsEnum(['pending', 'approved', 'rejected', 'needs_review'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Was this translation done by a human?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isHuman?: boolean;
}

export class UpdatePhraseDto {
  @ApiProperty({
    description: 'Phrase key (unique within the project)',
    required: false,
  })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({ description: 'Source text of the phrase', required: false })
  @IsString()
  @IsOptional()
  sourceText?: string;

  @ApiProperty({ description: 'Context for the phrase', required: false })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({
    description: 'Project ID',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  project?: string;

  @ApiProperty({
    description: 'Phrase status',
    enum: ['published', 'pending', 'needs_review', 'rejected', 'archived'],
    required: false,
  })
  @IsEnum(['published', 'pending', 'needs_review', 'rejected', 'archived'])
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Is the phrase archived?', required: false })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiProperty({
    description: 'Translations for different locales',
    type: () => UpdateTranslationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateTranslationDto)
  translations?: Record<string, UpdateTranslationDto>;

  @ApiProperty({
    description: 'Array of tags for the phrase',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Source URL where the phrase is used',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @ApiProperty({
    description: 'URL of a screenshot related to the phrase',
    required: false,
  })
  @IsString()
  @IsOptional()
  screenshot?: string;
}
