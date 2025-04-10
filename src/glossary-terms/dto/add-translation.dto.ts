import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddTranslationDto {
  @ApiProperty({ description: 'Translation text' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Translation status',
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    default: 'pending',
    required: false,
  })
  @IsEnum(['pending', 'approved', 'rejected', 'needs_review'])
  @IsOptional()
  status?: string = 'pending';

  @ApiProperty({
    description: 'Was this translation done by a human?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isHuman?: boolean = true;
}
