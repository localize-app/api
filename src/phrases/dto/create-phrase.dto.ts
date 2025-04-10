import {
  IsNotEmpty,
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

class TranslationDto {
  @ApiProperty({ description: 'Translation text' })
  @IsString()
  @IsNotEmpty()
  text: string;

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

export class CreatePhraseDto {
  @ApiProperty({ description: 'Phrase key (unique within the project)' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: 'Source text of the phrase' })
  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @ApiProperty({ description: 'Context for the phrase', required: false })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({ description: 'Project ID', format: 'ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({
    description: 'Phrase status',
    enum: ['published', 'pending', 'needs_review', 'rejected', 'archived'],
    required: false,
  })
  @IsEnum(['published', 'pending', 'needs_review', 'rejected', 'archived'])
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Is the phrase archived?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiProperty({
    description: 'Translations for different locales',
    type: () => TranslationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>;

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
