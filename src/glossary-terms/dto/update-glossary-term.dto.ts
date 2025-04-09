import {
  IsOptional,
  IsString,
  IsMongoId,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpdateGlossaryTermDto {
  @IsString()
  @IsOptional()
  term?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;

  @IsMongoId()
  @IsOptional()
  company?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[];

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
