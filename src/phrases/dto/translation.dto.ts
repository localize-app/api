import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { TranslationStatus } from '../entities/translation.entity';

export class TranslationDto {
  @ApiProperty({
    description: 'Translation text',
    example: "Vous êtes le seul employé de l'entreprise",
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Translation status',
    enum: TranslationStatus,
    default: TranslationStatus.PENDING,
    required: false,
  })
  @IsEnum(TranslationStatus)
  @IsOptional()
  status?: TranslationStatus = TranslationStatus.PENDING;

  @ApiProperty({
    description: 'Was this translation done by a human?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isHuman?: boolean = true;

  @ApiProperty({
    description: 'Review comments',
    required: false,
  })
  @IsString()
  @IsOptional()
  reviewComments?: string;

  @ApiProperty({
    description: 'Quality score (0-100)',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  qualityScore?: number;

  @ApiProperty({
    description: 'Does this translation need review?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  needsReview?: boolean = false;
}
