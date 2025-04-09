import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateLocaleDto {
  @IsString()
  @IsNotEmpty()
  code: string; // e.g., 'en-US', 'fr-CA'

  @IsString()
  @IsNotEmpty()
  language: string; // e.g., 'English'

  @IsOptional()
  content?: any; // Optional content of any type

  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // Defaults to true

  @IsArray()
  @IsMongoId({ each: true })
  projects: string[]; // Optional array of project IDs
}
