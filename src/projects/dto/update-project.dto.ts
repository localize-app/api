import {
  IsOptional,
  IsString,
  IsMongoId,
  IsArray,
  IsBoolean,
  IsEnum,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectType } from '../entities/project.entity';
import { LocaleCode } from 'src/common/enums/locale-code.enum';

class UpdateProjectSettingsDto {
  @ApiProperty({
    description: 'Enable translation quality assurance?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  translationQA?: boolean;

  @ApiProperty({
    description: 'Generate monthly translation reports?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  monthlyReport?: boolean;

  @ApiProperty({
    description: 'Automatically detect source language?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoDetectLanguage?: boolean;

  @ApiProperty({
    description: 'Automatically archive unused phrases?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  archiveUnusedPhrases?: boolean;

  @ApiProperty({ description: 'Translate meta tags?', required: false })
  @IsBoolean()
  @IsOptional()
  translateMetaTags?: boolean;

  @ApiProperty({ description: 'Translate ARIA labels?', required: false })
  @IsBoolean()
  @IsOptional()
  translateAriaLabels?: boolean;

  @ApiProperty({ description: 'Translate page titles?', required: false })
  @IsBoolean()
  @IsOptional()
  translatePageTitles?: boolean;

  @ApiProperty({
    description: 'Customize images based on locale?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customizeImages?: boolean;

  @ApiProperty({
    description: 'Customize URLs based on locale?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customizeUrls?: boolean;

  @ApiProperty({
    description: 'Customize audio based on locale?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customizeAudio?: boolean;

  @ApiProperty({
    description: 'Handle date formats based on locale?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  dateHandling?: boolean;

  @ApiProperty({
    description: 'Ignore currency formatting in translations?',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  ignoreCurrency?: boolean;
}

export class UpdateProjectDto {
  @ApiProperty({ description: 'Project name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Company ID',
    format: 'ObjectId',
    required: false,
  })
  @IsMongoId()
  @IsOptional()
  company?: string;

  @ApiProperty({
    description: 'Type of project',
    enum: ProjectType,
    required: false,
  })
  @IsEnum(ProjectType)
  @IsOptional()
  projectType?: ProjectType;

  @ApiProperty({ description: 'Website URL (if applicable)', required: false })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiProperty({ description: 'Unique project key', required: false })
  @IsString()
  @IsOptional()
  projectKey?: string;

  @ApiProperty({
    description: 'Source locale code for translations',
    enum: LocaleCode,
    required: false,
  })
  @IsEnum(LocaleCode)
  @IsOptional()
  sourceLocale?: LocaleCode;

  @ApiProperty({
    description: 'Array of supported locale codes',
    type: [String],
    enum: LocaleCode,
    example: [LocaleCode.EN_US, LocaleCode.FR_CA],
    required: false,
  })
  @IsArray()
  @IsEnum(LocaleCode, { each: true })
  @IsOptional()
  supportedLocales?: LocaleCode[];

  @ApiProperty({ description: 'Is the project archived?', required: false })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @ApiProperty({
    description: 'Array of member user IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];

  @ApiProperty({
    description: 'Project settings',
    type: () => UpdateProjectSettingsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProjectSettingsDto)
  settings?: UpdateProjectSettingsDto;
}
