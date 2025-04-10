import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateLocaleDto {
  @ApiProperty({ description: 'Locale code (e.g., en-US)' })
  @IsString()
  @IsNotEmpty()
  code: string; // e.g., 'en-US', 'fr-CA'

  @ApiProperty({ description: 'Language name (e.g., English)' })
  @IsString()
  @IsNotEmpty()
  language: string; // e.g., 'English'

  @ApiProperty({
    description: 'Locale content (can be any JSON object)',
    required: false,
  })
  @IsOptional()
  content?: any; // Optional content of any type

  @ApiProperty({
    description: 'Is the locale active?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // Defaults to true

  @ApiProperty({
    description: 'Array of project IDs',
    type: [String],
    format: 'ObjectId',
  })
  @IsArray()
  @IsMongoId({ each: true })
  projects: string[]; // Optional array of project IDs
}
