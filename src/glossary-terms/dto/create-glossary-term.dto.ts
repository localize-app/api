// src/glossary/dto/create-glossary-term.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateGlossaryTermDto {
  @IsString()
  @IsNotEmpty()
  term: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;

  @IsMongoId()
  @IsNotEmpty()
  company: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[];

  @IsMongoId()
  @IsOptional()
  createdBy?: string;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
