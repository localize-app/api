// src/phrases/dto/batch-operation.dto.ts
import {
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsMongoId,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum BatchOperation {
  APPROVE_TRANSLATIONS = 'approve_translations', // NEW
  REJECT_TRANSLATIONS = 'reject_translations', // NEW
  ARCHIVE = 'archive',
  DELETE = 'delete',
  TAG = 'tag',
  UNTAG = 'untag',
}

class BatchItemDto {
  @ApiProperty({ description: 'Item ID', format: 'ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class BatchOperationDto {
  @ApiProperty({
    description: 'Operation to perform',
    enum: BatchOperation,
    example: BatchOperation.APPROVE_TRANSLATIONS,
  })
  @IsEnum(BatchOperation)
  @IsNotEmpty()
  operation: BatchOperation;

  @ApiProperty({
    description: 'Array of items to operate on',
    type: [BatchItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];

  @ApiProperty({
    description: 'Tag value (for tag/untag operations)',
    required: false,
    example: 'homepage',
  })
  @IsOptional()
  @IsString()
  tag?: string; // Used for tag/untag operations

  @ApiProperty({
    description: 'Locale code (for translation operations)',
    required: false,
    example: 'fr-CA',
  })
  @IsOptional()
  @IsString()
  locale?: string; // Used for approve/reject translation operations
}
