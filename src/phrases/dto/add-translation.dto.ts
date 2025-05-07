import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
} from 'class-validator';
import { TranslationStatus } from '../entities/translation.entity';

export class AddTranslationDto {
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
    description: 'User ID who modified this translation',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  modifiedBy?: string;
}
