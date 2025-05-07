import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
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
}
