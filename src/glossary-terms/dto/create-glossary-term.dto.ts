// src/glossary/dto/create-glossary-term.dto.ts
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'Glossary term' })
  @IsString()
  @IsNotEmpty()
  term: string;

  @ApiProperty({ description: 'Term description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Translations in different languages',
    example: { en: 'Example', fr: 'Exemple' },
  })
  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;

  @ApiProperty({ description: 'Company ID', format: 'ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  company: string;

  @ApiProperty({
    description: 'Array of project IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[];

  @ApiProperty({
    description: 'ID of the user who created the term',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({
    description: 'Is this a global term?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean = false;

  @ApiProperty({
    description: 'Is the term currently active?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    description: 'Array of tags',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
