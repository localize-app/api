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

class BatchItemDto {
  @ApiProperty({ description: 'Item ID', format: 'ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class BatchOperationDto {
  @ApiProperty({
    description: 'Operation to perform',
    enum: ['publish', 'archive', 'delete', 'tag', 'untag'],
  })
  @IsEnum(['publish', 'archive', 'delete', 'tag', 'untag'])
  @IsNotEmpty()
  operation: string;

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
  })
  @IsOptional()
  @IsString()
  tag?: string; // Used for tag/untag operations
}
