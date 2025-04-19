// src/users/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class UserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "User's first name" })
  @IsString()
  firstName: string;

  @ApiProperty({ description: "User's last name", required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: "User's avatar URL", required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: 'User role',
    enum: Object.values(Role),
    default: Role.MEMBER,
  })
  @IsEnum(Role)
  role: string;

  @ApiProperty({
    description: 'Company ID the user belongs to',
    type: String,
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  company?: string;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  lastLoginAt?: Date;
}
