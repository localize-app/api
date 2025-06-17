// src/phrases/dto/extract-phrases.dto.ts
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
} from 'class-validator';

export class PhraseLocationDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  element?: string;
}

export class ExtractPhraseItemDto {
  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsNumber()
  @IsOptional()
  count?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PhraseLocationDto)
  locations?: PhraseLocationDto[];

  // NEW: Optional hash provided by client for verification
  @IsString()
  @IsOptional()
  hash?: string;
}

export class ExtractPhrasesDto {
  @IsString()
  @IsNotEmpty()
  projectKey: string;

  @IsString()
  @IsNotEmpty()
  sourceUrl: string;

  @IsString()
  @IsOptional()
  sourceType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractPhraseItemDto)
  phrases: ExtractPhraseItemDto[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  // NEW: Options for hash-based processing
  @IsObject()
  @IsOptional()
  hashOptions?: {
    verifyHashes?: boolean; // Verify client-provided hashes
    detectDuplicates?: boolean; // Check for duplicates across projects
    trackChanges?: boolean; // Track if phrases have changed
  };
}
