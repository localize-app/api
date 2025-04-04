import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Company name is required

  @IsString()
  @IsOptional()
  description?: string; // Optional description

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  platforms?: string[]; // Optional array of platform IDs

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  users?: string[]; // Optional array of user IDs
}
