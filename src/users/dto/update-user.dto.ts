import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEmail,
  IsString,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class UpdateUserDto {
  @ApiProperty({ description: 'User email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User password', required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ description: "User's first name", required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ description: "User's last name", required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: 'User role',
    enum: Object.values(Role),
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'User company',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  company?: string;
}
