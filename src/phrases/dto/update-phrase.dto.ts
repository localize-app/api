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

class UpdateTranslationDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsEnum(['pending', 'approved', 'rejected', 'needs_review'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isHuman?: boolean;
}

export class UpdatePhraseDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  sourceText?: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsMongoId()
  @IsOptional()
  project?: string;

  @IsEnum(['published', 'pending', 'needs_review', 'rejected', 'archived'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateTranslationDto)
  translations?: Record<string, UpdateTranslationDto>;

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
