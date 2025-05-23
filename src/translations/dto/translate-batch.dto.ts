import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class TranslateBatchDto {
  @ApiProperty({
    description: 'The texts to translate',
    example: ['Hello, world!', 'How are you?'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  texts: string[];

  @ApiProperty({
    description: 'Target language code or locale',
    example: 'fr-FR',
  })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiProperty({
    description: 'Source language code or locale',
    example: 'en-US',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceLanguage?: string = 'en-US';
}
