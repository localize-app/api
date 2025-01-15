import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PlatformsService } from './platforms.service';
import { PlatformsController } from './platforms.controller';
import { Platform, PlatformSchema } from './entities/platform.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Platform.name, schema: PlatformSchema },
    ]),
  ],
  controllers: [PlatformsController],
  providers: [PlatformsService],
})
export class PlatformsModule {}
