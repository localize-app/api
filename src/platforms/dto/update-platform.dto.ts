import { IsOptional, IsString, IsArray, ArrayUnique } from 'class-validator';

export class UpdatePlatformDto {
  @IsString()
  @IsOptional()
  name?: string; // Optional to update the platform name.

  @IsString()
  @IsOptional()
  description?: string; // Optional to update the description.

  @IsArray()
  @ArrayUnique()
  @IsOptional()
  supportedLocales?: string[]; // Optional to update the supported locales array.

  @IsString()
  @IsOptional()
  company?: string; // Optional to update the company ID.
}
