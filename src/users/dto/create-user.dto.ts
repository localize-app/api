import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsMongoId,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password (will be hashed)' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: "User's first name" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: "User's last name", required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'User role',
    enum: Object.values(Role),
    default: Role.MEMBER,
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: string = Role.MEMBER;

  @ApiProperty({
    description: 'Is user a system administrator',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystemAdmin?: boolean = false;

  @ApiProperty({
    description: 'ID of the company the user belongs to',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId({ each: true })
  @IsOptional()
  company?: string[];
}
