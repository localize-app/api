// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolePermissionsService } from './role-permission.service';
import { AuthorizationGuard } from './guards/auth.guard';

@Module({
  imports: [
    forwardRef(() => UsersModule), // Use forwardRef here too
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RolePermissionsService,
    AuthorizationGuard,
  ],
  exports: [AuthService, RolePermissionsService, AuthorizationGuard],
})
export class AuthModule {}
