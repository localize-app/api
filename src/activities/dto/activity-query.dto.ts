// src/activity/dto/activity-query.dto.ts
import {
  IsOptional,
  IsString,
  IsMongoId,
  IsDateString,
  IsEnum,
} from 'class-validator';

export class ActivityQueryDto {
  @IsMongoId()
  @IsOptional()
  user?: string;

  @IsMongoId()
  @IsOptional()
  company?: string;

  @IsMongoId()
  @IsOptional()
  project?: string;

  @IsEnum([
    'created_phrase',
    'translated_phrase',
    'added_user',
    'removed_user',
    'updated_settings',
    'all',
  ])
  @IsOptional()
  actionType?: string = 'all';

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
