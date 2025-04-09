// src/activity/dto/create-activity.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsDate,
  IsObject,
} from 'class-validator';

export class CreateActivityDto {
  @IsMongoId()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  actionType: string;

  @IsObject()
  @IsOptional()
  details?: Record<string, any>;

  @IsMongoId()
  @IsOptional()
  entityId?: string;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsMongoId()
  @IsNotEmpty()
  company: string;

  @IsMongoId()
  @IsOptional()
  project?: string;

  @IsDate()
  @IsOptional()
  timestamp?: Date = new Date();

  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean = false;
}
