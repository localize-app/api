import {
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

export class UpdatePhraseDto {
  @ApiProperty({
    description: 'Phrase key (unique within the project)',
    required: false,
    example: 'welcome_message_updated',
  })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({
    description: 'Source text of the phrase',
    required: false,
    example:
      "You are the business's lone employee, resulting in an automatic saleability score of Red.",
  })
  @IsString()
  @IsOptional()
  sourceText?: string;

  @ApiProperty({
    description: 'Context for the phrase',
    required: false,
    example: 'Business valuation results page',
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiProperty({
    description: 'Project ID',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  project?: string;

  // REMOVED: status property

  @ApiProperty({
    description: 'Is the phrase archived?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiProperty({
    description: 'Translations for different locales',
    type: Object,
    additionalProperties: {
      type: 'object',
      $ref: '#/components/schemas/TranslationDto',
    },
    required: false,
    example: {
      'fr-CA': {
        text: "Vous êtes le seul employé de l'entreprise, ce qui entraîne un résultat de vendabilité automatique de Rouge.",
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
    example: ['homepage', 'business', 'valuation'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Array of label IDs for the phrase',
    type: [String],
    required: false,
    example: ['60f7b3b3b3b3b3b3b3b3b3b3', '60f7b3b3b3b3b3b3b3b3b3b4'],
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  labels?: string[];

  @ApiProperty({
    description: 'Source URL where the phrase is used',
    required: false,
    example: 'https://example.com/valuation/results',
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
