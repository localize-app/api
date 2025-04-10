import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEmail,
  IsString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'User email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string; // Optional email update

  @ApiProperty({ description: 'User password', required: false })
  @IsString()
  @IsOptional()
  password?: string; // Optional password update

  @ApiProperty({ description: "User's first name", required: false })
  @IsString()
  @IsOptional()
  firstName?: string; // Optional first name update

  @ApiProperty({ description: "User's last name", required: false })
  @IsString()
  @IsOptional()
  lastName?: string; // Optional last name update

  @ApiProperty({
    description: 'Array of user roles',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[]; // Optional roles update

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
