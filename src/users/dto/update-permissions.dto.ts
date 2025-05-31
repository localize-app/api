import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdatePermissionsDto {
  // User management
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

  // Project management
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

  // Content management
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

  @ApiProperty({ description: 'Can translate', required: false })
  @IsBoolean()
  @IsOptional()
  canTranslate?: boolean;

  @ApiProperty({ description: 'Can approve translations', required: false })
  @IsBoolean()
  @IsOptional()
  canApproveTranslations?: boolean;

  // Locale management
  @ApiProperty({ description: 'Can manage locales', required: false })
  @IsBoolean()
  @IsOptional()
  canManageLocales?: boolean;

  // Glossary management
  @ApiProperty({ description: 'Can manage glossary', required: false })
  @IsBoolean()
  @IsOptional()
  canManageGlossary?: boolean;

  // Integration management
  @ApiProperty({ description: 'Can manage integrations', required: false })
  @IsBoolean()
  @IsOptional()
  canManageIntegrations?: boolean;

  // Settings management
  @ApiProperty({ description: 'Can manage settings', required: false })
  @IsBoolean()
  @IsOptional()
  canManageSettings?: boolean;

  // Reports and analytics
  @ApiProperty({ description: 'Can view reports', required: false })
  @IsBoolean()
  @IsOptional()
  canViewReports?: boolean;

  @ApiProperty({ description: 'Can export data', required: false })
  @IsBoolean()
  @IsOptional()
  canExportData?: boolean;
}
