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

class ProjectSettingsDto {
  @IsBoolean()
  @IsOptional()
  translationQA?: boolean = true;

  @IsBoolean()
  @IsOptional()
  monthlyReport?: boolean = true;

  @IsBoolean()
  @IsOptional()
  autoDetectLanguage?: boolean = true;

  @IsBoolean()
  @IsOptional()
  archiveUnusedPhrases?: boolean = false;

  @IsBoolean()
  @IsOptional()
  translateMetaTags?: boolean = true;

  @IsBoolean()
  @IsOptional()
  translateAriaLabels?: boolean = true;

  @IsBoolean()
  @IsOptional()
  translatePageTitles?: boolean = true;

  @IsBoolean()
  @IsOptional()
  customizeImages?: boolean = false;

  @IsBoolean()
  @IsOptional()
  customizeUrls?: boolean = false;

  @IsBoolean()
  @IsOptional()
  customizeAudio?: boolean = false;

  @IsBoolean()
  @IsOptional()
  dateHandling?: boolean = true;

  @IsBoolean()
  @IsOptional()
  ignoreCurrency?: boolean = false;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  company: string;

  @IsEnum(['website', 'webapp', 'mobile_app', 'desktop_app', 'other'])
  @IsOptional()
  projectType?: string = 'website';

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsOptional()
  projectKey?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedLocales?: string[] = [];

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean = false;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[] = [];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  settings?: ProjectSettingsDto;
}
