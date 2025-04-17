import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import {
  Integration,
  IntegrationSchema,
  configureIntegrationDiscriminators,
} from './entities/integration.entity';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Integration.name,
        useFactory: () => {
          const schema = IntegrationSchema;
          return configureIntegrationDiscriminators(schema);
        },
      },
    ]),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
