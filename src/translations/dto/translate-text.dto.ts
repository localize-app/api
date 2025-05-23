import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class TranslateTextDto {
  @ApiProperty({
    description: 'The text to translate',
    example: 'Hello, world!',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

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
