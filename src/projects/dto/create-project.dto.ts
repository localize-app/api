import {
  IsNotEmpty,
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

class ProjectSettingsDto {
  @ApiProperty({
    description: 'Enable translation quality assurance?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  translationQA?: boolean = true;

  @ApiProperty({
    description: 'Generate monthly translation reports?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  monthlyReport?: boolean = true;

  @ApiProperty({
    description: 'Automatically detect source language?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoDetectLanguage?: boolean = true;

  @ApiProperty({
    description: 'Automatically archive unused phrases?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  archiveUnusedPhrases?: boolean = false;

  @ApiProperty({
    description: 'Translate meta tags?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  translateMetaTags?: boolean = true;

  @ApiProperty({
    description: 'Translate ARIA labels?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  translateAriaLabels?: boolean = true;

  @ApiProperty({
    description: 'Translate page titles?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  translatePageTitles?: boolean = true;

  @ApiProperty({
    description: 'Customize images based on locale?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customizeImages?: boolean = false;

  @ApiProperty({
    description: 'Customize URLs based on locale?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customizeUrls?: boolean = false;

  @ApiProperty({
    description: 'Customize audio based on locale?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  customizeAudio?: boolean = false;

  @ApiProperty({
    description: 'Handle date formats based on locale?',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  dateHandling?: boolean = true;

  @ApiProperty({
    description: 'Ignore currency formatting in translations?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  ignoreCurrency?: boolean = false;
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Company ID', format: 'ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  company: string;

  @ApiProperty({
    description: 'Type of project',
    enum: ProjectType,
    default: ProjectType.WEBSITE,
    required: false,
  })
  @IsEnum(ProjectType)
  @IsOptional()
  projectType?: ProjectType = ProjectType.WEBSITE;

  @ApiProperty({ description: 'Website URL (if applicable)', required: false })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiProperty({ description: 'Unique project key', required: false })
  @IsString()
  @IsOptional()
  projectKey?: string;

  // source locale
  @ApiProperty({
    description: 'Source locale code',
    enum: LocaleCode,
    example: LocaleCode.EN_US,
  })
  @IsEnum(LocaleCode)
  @IsNotEmpty()
  sourceLocale: LocaleCode;

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
  supportedLocales?: LocaleCode[] = [];

  @ApiProperty({
    description: 'Is the project archived?',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean = false;

  @ApiProperty({
    description: 'Array of member user IDs',
    type: [String],
    format: 'ObjectId',
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[] = [];

  @ApiProperty({
    description: 'Project settings',
    type: () => ProjectSettingsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}
