import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class CreatePlatformDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Platform name is required and must be a string.

  @IsString()
  @IsOptional()
  description?: string; // Description is optional but must be a string if provided.

  @IsArray()
  @ArrayUnique()
  @IsOptional()
  supportedLocales?: string[]; // Optional array of unique locale codes (e.g., ['en-US', 'fr-FR']).

  @IsString()
  @IsNotEmpty()
  company: string; // Company ID is required and must be a string.
}
