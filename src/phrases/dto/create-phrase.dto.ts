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

class TranslationDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(['pending', 'approved', 'rejected', 'needs_review'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isHuman?: boolean;
}

export class CreatePhraseDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @IsEnum(['published', 'pending', 'needs_review', 'rejected', 'archived'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @IsString()
  @IsOptional()
  screenshot?: string;
}
