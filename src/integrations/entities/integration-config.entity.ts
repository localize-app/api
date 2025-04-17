// src/integrations/entities/integration-config.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false, discriminatorKey: 'configType' })
export class BaseIntegrationConfig {
  // The discriminator key will be added automatically by Mongoose
  // Don't define a property with the same name as the discriminator key
}

export const BaseIntegrationConfigSchema = SchemaFactory.createForClass(
  BaseIntegrationConfig,
);

// Google Analytics config
@Schema({ _id: false })
export class GoogleAnalyticsConfig extends BaseIntegrationConfig {
  @Prop({ required: true })
  trackingId: string;

  @Prop()
  domain?: string;

  @Prop({ default: false })
  anonymizeIp: boolean;

  @Prop({ default: true })
  trackPageviews: boolean;
}

export const GoogleAnalyticsConfigSchema = SchemaFactory.createForClass(
  GoogleAnalyticsConfig,
);

// Mixpanel config
@Schema({ _id: false })
export class MixpanelConfig extends BaseIntegrationConfig {
  @Prop({ required: true })
  projectToken: string;

  @Prop({ default: false })
  enablePeopleProperties: boolean;
}

export const MixpanelConfigSchema =
  SchemaFactory.createForClass(MixpanelConfig);

// Google Translate config
@Schema({ _id: false })
export class GoogleTranslateConfig extends BaseIntegrationConfig {
  @Prop({ required: true })
  apiKey: string;

  @Prop({ type: [String], default: [] })
  enabledLanguages: string[];

  @Prop({ default: false })
  useNeuralTranslation: boolean;
}

export const GoogleTranslateConfigSchema = SchemaFactory.createForClass(
  GoogleTranslateConfig,
);
