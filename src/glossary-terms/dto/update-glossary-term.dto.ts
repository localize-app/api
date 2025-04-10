import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpdateGlossaryTermDto {
  @ApiProperty({ description: 'Glossary term', required: false })
  @IsString()
  @IsOptional()
  term?: string;

  @ApiProperty({ description: 'Term description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Translations in different languages',
    example: { en: 'Updated Example', fr: 'Exemple mis à jour' },
  })
  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;

  @ApiProperty({
    description: 'Company ID',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  company?: string;

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

  @ApiProperty({ description: 'Is this a global term?', required: false })
  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @ApiProperty({
    description: 'Is the term currently active?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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
