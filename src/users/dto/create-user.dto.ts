import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string; // User's email

  @ApiProperty({ description: 'User password (will be hashed)' })
  @IsString()
  @IsNotEmpty()
  password: string; // Hashed password

  @ApiProperty({ description: "User's first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string; // User's first name

  @ApiProperty({ description: "User's last name", required: false })
  @IsString()
  @IsOptional()
  lastName?: string; // Optional last name

  @ApiProperty({
    description: 'Array of user roles',
    type: [String],
    example: ['admin', 'translator'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[]; // Array of roles (optional)

  @ApiProperty({
    description: 'ID of the company the user belongs to',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId({ each: true })
  @IsOptional()
  company?: string; // Optional array of company IDs
}
