import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { Invitation, InvitationSchema } from './entities/invitation.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { UsersModule } from '../users/users.module';
import { CompaniesModule } from '../companies/companies.module';
import { RolePermissionsService } from '../auth/role-permission.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invitation.name, schema: InvitationSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => CompaniesModule),
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, RolePermissionsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}