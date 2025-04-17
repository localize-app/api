import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEmail,
  IsString,
  IsArray,
  IsMongoId,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from 'src/common/enums/role.enum';

// This class allows updating any subset of user permissions
export class UpdateUserPermissionsDto {
  @ApiProperty({ description: 'Can manage users', required: false })
  @IsBoolean()
  @IsOptional()
  canManageUsers?: boolean;

  @ApiProperty({ description: 'Can invite users', required: false })
  @IsBoolean()
  @IsOptional()
  canInviteUsers?: boolean;

  @ApiProperty({ description: 'Can remove users', required: false })
  @IsBoolean()
  @IsOptional()
  canRemoveUsers?: boolean;

  @ApiProperty({ description: 'Can create projects', required: false })
  @IsBoolean()
  @IsOptional()
  canCreateProjects?: boolean;

  @ApiProperty({ description: 'Can manage projects', required: false })
  @IsBoolean()
  @IsOptional()
  canManageProjects?: boolean;

  @ApiProperty({ description: 'Can archive projects', required: false })
  @IsBoolean()
  @IsOptional()
  canArchiveProjects?: boolean;

  @ApiProperty({ description: 'Can create phrases', required: false })
  @IsBoolean()
  @IsOptional()
  canCreatePhrases?: boolean;

  @ApiProperty({ description: 'Can edit phrases', required: false })
  @IsBoolean()
  @IsOptional()
  canEditPhrases?: boolean;

  @ApiProperty({ description: 'Can delete phrases', required: false })
  @IsBoolean()
  @IsOptional()
  canDeletePhrases?: boolean;

  @ApiProperty({ description: 'Can translate content', required: false })
  @IsBoolean()
  @IsOptional()
  canTranslate?: boolean;

  @ApiProperty({ description: 'Can approve translations', required: false })
  @IsBoolean()
  @IsOptional()
  canApproveTranslations?: boolean;

  @ApiProperty({ description: 'Can manage locales', required: false })
  @IsBoolean()
  @IsOptional()
  canManageLocales?: boolean;

  @ApiProperty({ description: 'Can manage glossary', required: false })
  @IsBoolean()
  @IsOptional()
  canManageGlossary?: boolean;

  @ApiProperty({ description: 'Can manage integrations', required: false })
  @IsBoolean()
  @IsOptional()
  canManageIntegrations?: boolean;

  @ApiProperty({ description: 'Can manage settings', required: false })
  @IsBoolean()
  @IsOptional()
  canManageSettings?: boolean;

  @ApiProperty({ description: 'Can view reports', required: false })
  @IsBoolean()
  @IsOptional()
  canViewReports?: boolean;

  @ApiProperty({ description: 'Can export data', required: false })
  @IsBoolean()
  @IsOptional()
  canExportData?: boolean;
}

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
    description: 'Is the user a system administrator',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystemAdmin?: boolean;

  @ApiProperty({
    description: 'User role',
    enum: Object.values(Role),
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: string;

  @ApiProperty({
    description: 'User permissions',
    type: UpdateUserPermissionsDto,
    required: false,
  })
  @ValidateNested()
  @Type(() => UpdateUserPermissionsDto)
  @IsOptional()
  permissions?: UpdateUserPermissionsDto;

  @ApiProperty({
    description: 'User companies',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  companies?: string[];
}
