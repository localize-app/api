import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  name: string; // Company name is required

  @ApiProperty({ description: 'Company description', required: false })
  @IsString()
  @IsOptional()
  description?: string; // Optional description

  @ApiProperty({
    description: 'Array of project IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  projects?: string[]; // Optional array of project IDs

  @ApiProperty({
    description: 'Maximum number of projects allowed',
    required: false,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxProjects?: number; // Maximum projects limit

  @ApiProperty({
    description: 'Maximum number of team members allowed',
    required: false,
    default: 50,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTeamMembers?: number; // Maximum team members limit

  @ApiProperty({
    description: 'Whether the organization is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean; // Organization active status
}
