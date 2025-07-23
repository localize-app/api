// src/translations/dto/instant-translate.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class InstantTranslateDto {
  @ApiProperty({
    description: 'Array of texts to translate',
    example: ['Hello world', 'Welcome to our site'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50) // Limit batch size
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  texts: string[];

  @ApiProperty({
    description: 'Source language code',
    example: 'en',
    default: 'en',
  })
  @IsString()
  @IsOptional()
  sourceLanguage: string = 'en';

  @ApiProperty({
    description: 'Target language code',
    example: 'es',
  })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiProperty({
    description: 'Context path for caching',
    example: '/home',
    required: false,
  })
  @IsString()
  @IsOptional()
  context?: string;
}

export class InstantTranslateResponseDto {
  @ApiProperty({
    description: 'Array of translated texts in the same order as input',
    example: ['Hola mundo', 'Bienvenido a nuestro sitio'],
    type: [String],
  })
  translations: string[];

  @ApiProperty({
    description: 'Source language used',
    example: 'en',
  })
  sourceLanguage: string;

  @ApiProperty({
    description: 'Target language used',
    example: 'es',
  })
  targetLanguage: string;

  @ApiProperty({
    description: 'ISO timestamp of translation',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}
