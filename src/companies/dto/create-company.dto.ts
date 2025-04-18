import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
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

  // Removed users array as users will reference the company
}
