import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { LocaleCode } from 'src/common/enums/locale-code.enum';

export class CreateLocaleDto {
  @ApiProperty({
    description: 'Locale code',
    enum: LocaleCode,
    example: LocaleCode.EN_US,
  })
  @IsEnum(LocaleCode)
  @IsNotEmpty()
  code: LocaleCode; // Now using enum

  @ApiProperty({ description: 'Language name (e.g., English)' })
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
