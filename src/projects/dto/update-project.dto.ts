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

class UpdateProjectSettingsDto {
  @IsBoolean()
  @IsOptional()
  translationQA?: boolean;

  @IsBoolean()
  @IsOptional()
  monthlyReport?: boolean;

  @IsBoolean()
  @IsOptional()
  autoDetectLanguage?: boolean;

  @IsBoolean()
  @IsOptional()
  archiveUnusedPhrases?: boolean;

  @IsBoolean()
  @IsOptional()
  translateMetaTags?: boolean;

  @IsBoolean()
  @IsOptional()
  translateAriaLabels?: boolean;

  @IsBoolean()
  @IsOptional()
  translatePageTitles?: boolean;

  @IsBoolean()
  @IsOptional()
  customizeImages?: boolean;

  @IsBoolean()
  @IsOptional()
  customizeUrls?: boolean;

  @IsBoolean()
  @IsOptional()
  customizeAudio?: boolean;

  @IsBoolean()
  @IsOptional()
  dateHandling?: boolean;

  @IsBoolean()
  @IsOptional()
  ignoreCurrency?: boolean;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  company?: string;

  @IsEnum(['website', 'webapp', 'mobile_app', 'desktop_app', 'other'])
  @IsOptional()
  projectType?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  projectKey?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLocales?: string[];

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProjectSettingsDto)
  settings?: UpdateProjectSettingsDto;
}
