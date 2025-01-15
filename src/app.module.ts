import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompaniesModule } from './companies/companies.module';
import { PlatformsModule } from './platforms/platforms.module';
import { UsersModule } from './users/users.module';
import { LocalesModule } from './locales/locales.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'),
    CompaniesModule,
    PlatformsModule,
    UsersModule,
    LocalesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
