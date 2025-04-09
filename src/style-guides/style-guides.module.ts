import { Module } from '@nestjs/common';
import { StyleGuidesService } from './style-guides.service';
import { StyleGuidesController } from './style-guides.controller';

@Module({
  controllers: [StyleGuidesController],
  providers: [StyleGuidesService],
})
export class StyleGuidesModule {}
