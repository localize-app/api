import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsArray,
  IsBoolean,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TranslationDto } from './translation.dto';

export class CreatePhraseDto {
  @ApiProperty({
    description: 'Phrase key (unique within the project)',
    example: 'welcome_message',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Source text of the phrase',
    example:
      "You are the business's lone employee, resulting in an automatic saleability",
  })
  @IsString()
  @IsNotEmpty()
  sourceText: string;

  @ApiProperty({
    description: 'Context for the phrase',
    required: false,
    example: 'Business valuation page',
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({ description: 'Project ID', format: 'ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  // REMOVED: status property

  @ApiProperty({
    description: 'Is the phrase archived?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean = false;

  @ApiProperty({
    description: 'Initial translations for different locales',
    type: Object,
    additionalProperties: {
      type: 'object',
      $ref: '#/components/schemas/TranslationDto',
    },
    required: false,
    example: {
      'fr-CA': {
        text: "Vous êtes le seul employé de l'entreprise, ce qui entraîne une vendabilité automatique",
        status: 'pending',
        isHuman: true,
      },
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  translations?: Record<string, TranslationDto>;

  @ApiProperty({
    description: 'Array of tags for the phrase',
    type: [String],
    required: false,
    example: ['homepage', 'business'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @ApiProperty({
    description: 'Source URL where the phrase is used',
    required: false,
    example: 'https://example.com/valuation',
  })
  @IsUrl()
  @IsOptional()
  sourceUrl?: string;

  @ApiProperty({
    description: 'URL of a screenshot related to the phrase',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  screenshot?: string;
}
