import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsMongoId } from 'class-validator';

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Company name', required: false })
  @IsString()
  @IsOptional()
  name?: string; // Optional name update

  @ApiProperty({ description: 'Company description', required: false })
  @IsString()
  @IsOptional()
  description?: string; // Optional description update

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
    description: 'Array of user IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  users?: string[]; // Optional array of user IDs
}
