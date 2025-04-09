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

class BatchItemDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}

export class BatchOperationDto {
  @IsEnum(['publish', 'archive', 'delete', 'tag', 'untag'])
  @IsNotEmpty()
  operation: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];

  @IsOptional()
  @IsString()
  tag?: string; // Used for tag/untag operations
}
