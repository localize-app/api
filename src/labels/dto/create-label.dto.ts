import { IsString, IsOptional, IsBoolean, IsEnum, IsHexColor } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsEnum(['functional', 'platform', 'priority', 'status', 'content-type', 'workflow', 'custom'])
  category: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  project?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}