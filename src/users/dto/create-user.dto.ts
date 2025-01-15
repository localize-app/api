import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string; // User's email

  @IsString()
  @IsNotEmpty()
  password: string; // Hashed password

  @IsString()
  @IsNotEmpty()
  firstName: string; // User's first name

  @IsString()
  @IsOptional()
  lastName?: string; // Optional last name

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[]; // Array of roles (optional)

  @IsMongoId({ each: true })
  @IsOptional()
  company?: string; // Optional array of company IDs
}
