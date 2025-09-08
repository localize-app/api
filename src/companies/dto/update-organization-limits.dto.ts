import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateOrganizationLimitsDto {
  @ApiProperty({
    description: 'Whether the organization is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Maximum number of projects the organization can have',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxProjects?: number;

  @ApiProperty({
    description: 'Maximum number of team members the organization can have',
    example: 50,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTeamMembers?: number;
}