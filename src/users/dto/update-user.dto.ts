import {
  IsOptional,
  IsEmail,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string; // Optional email update

  @IsString()
  @IsOptional()
  password?: string; // Optional password update

  @IsString()
  @IsOptional()
  firstName?: string; // Optional first name update

  @IsString()
  @IsOptional()
  lastName?: string; // Optional last name update

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[]; // Optional roles update

  @IsMongoId({ each: true })
  @IsOptional()
  company?: string; // Optional array of company IDs
}
