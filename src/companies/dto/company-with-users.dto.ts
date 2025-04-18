// src/companies/dto/company-with-users.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ValidateNested,
  IsArray,
  IsOptional,
  IsMongoId,
} from 'class-validator';
import { UserDto } from 'src/users/dto/user.dto';

export class CompanyWithUsersDto {
  @ApiProperty({ description: 'Company ID' })
  id: string;

  @ApiProperty({ description: 'Company name' })
  name: string;

  @ApiProperty({ description: 'Company description', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of project IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[];

  @ApiProperty({
    description: 'Users belonging to this company',
    type: [UserDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  users: UserDto[];
}
