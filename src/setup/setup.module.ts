import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SetupService } from './setup.service';
import { User, UserSchema } from '../users/entities/user.entity';
import { Company, CompanySchema } from '../companies/entities/company.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  providers: [SetupService],
  exports: [SetupService],
})
export class SetupModule {}
