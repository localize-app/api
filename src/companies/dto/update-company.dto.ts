import { IsOptional, IsString, IsArray, IsMongoId } from 'class-validator';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string; // Optional name update

  @IsString()
  @IsOptional()
  description?: string; // Optional description update

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[]; // Optional array of project IDs

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  users?: string[]; // Optional array of user IDs
}
