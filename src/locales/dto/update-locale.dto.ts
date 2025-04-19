import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocaleCode } from 'src/common/enums/locale-code.enum';

export class UpdateLocaleDto {
  @ApiProperty({
    description: 'Locale code',
    enum: LocaleCode,
    example: LocaleCode.EN_US,
    required: false,
  })
  @IsEnum(LocaleCode)
  @IsOptional()
  code?: LocaleCode; // Now using enum

  @ApiProperty({
    description: 'Language name (e.g., English)',
    required: false,
  })
  @IsOptional()
  language?: string; // Optional language update

  @ApiProperty({
    description: 'Locale content (can be any JSON object)',
    required: false,
  })
  @IsOptional()
  content?: any; // Optional content update

  @ApiProperty({
    description: 'Is the locale active?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // Optional isActive update

  @ApiProperty({
    description: 'Array of project IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[]; // Optional array of project IDs
}
