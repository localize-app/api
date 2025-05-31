// src/users/users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // Use forwardRef to avoid circular dependency
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // This exports UsersService, making it available to other modules
})
export class UsersModule {}
