import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Project } from 'src/projects/entities/project.entity';
import { BaseEntity, baseSchemaOptions } from 'src/common/entities/base.entity';
import {
  BaseIntegrationConfig,
  BaseIntegrationConfigSchema,
  GoogleAnalyticsConfigSchema,
  MixpanelConfigSchema,
  GoogleTranslateConfigSchema,
} from './integration-config.entity';

export type IntegrationDocument = HydratedDocument<Integration>;

export enum IntegrationType {
  GOOGLE_ANALYTICS = 'google_analytics',
  MIXPANEL = 'mixpanel',
  HEAP = 'heap',
  GOOGLE_TRANSLATE = 'google_translate',
  DEEPL = 'deepl',
  CUSTOM = 'custom',
}

@Schema(baseSchemaOptions)
export class Integration extends BaseEntity {
  @Prop({
    enum: Object.values(IntegrationType),
    required: true,
    type: String,
  })
  type: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: BaseIntegrationConfigSchema })
  config: BaseIntegrationConfig;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  project: Project;

  @Prop({ default: false })
  isEnabled: boolean;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  @Prop()
  apiKey?: string;

  @Prop()
  apiEndpoint?: string;
}

export const IntegrationSchema = SchemaFactory.createForClass(Integration);

// We need to handle discriminators differently with NestJS
// This will be properly configured in the module initialization
export function configureIntegrationDiscriminators(schema: mongoose.Schema) {
  // Get the config path from the schema
  const configPath = schema.path('config') as any;

  // Add discriminators if the path exists and supports discriminators
  if (configPath && typeof configPath.discriminator === 'function') {
    configPath.discriminator(
      IntegrationType.GOOGLE_ANALYTICS,
      GoogleAnalyticsConfigSchema,
    );

    configPath.discriminator(IntegrationType.MIXPANEL, MixpanelConfigSchema);

    configPath.discriminator(
      IntegrationType.GOOGLE_TRANSLATE,
      GoogleTranslateConfigSchema,
    );
  }

  return schema;
}
