import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class UpdateLocaleDto {
  @IsString()
  @IsOptional()
  code?: string; // Optional code update

  @IsString()
  @IsOptional()
  language?: string; // Optional language update

  @IsOptional()
  content?: any; // Optional content update

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // Optional isActive update

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[]; // Optional array of project IDs
}
