import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsMongoId,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';

export class CreateIntegrationDto {
  @ApiProperty({
    description: 'Integration type',
    enum: [
      'google_analytics',
      'heap',
      'mixpanel',
      'google_translate',
      'deepl',
      'custom',
    ],
    example: 'google_analytics',
  })
  @IsEnum([
    'google_analytics',
    'heap',
    'mixpanel',
    'google_translate',
    'deepl',
    'custom',
  ])
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Integration name',
    example: 'Production GA',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Integration configuration',
    example: { trackingId: 'UA-12345-6', domain: 'example.com' },
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiProperty({
    description: 'Associated project ID',
    format: 'ObjectId',
  })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({
    description: 'Whether the integration is enabled',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean = false;

  @ApiProperty({
    description: 'API key for the integration service',
    required: false,
  })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({
    description: 'API endpoint for the integration service',
    required: false,
  })
  @IsString()
  @IsOptional()
  apiEndpoint?: string;
}
