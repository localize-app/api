// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolePermissionsService } from './role-permission.service';
import { AuthorizationGuard } from './guards/auth.guard';
import { TokenBlacklistService } from './services/token-blacklist.service';
import {
  BlacklistedToken,
  BlacklistedTokenSchema,
} from './entities/blacklisted-token.entity';

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
    MongooseModule.forFeature([
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute per IP
      },
      {
        name: 'medium',
        ttl: 600000, // 10 minutes
        limit: 50, // 50 requests per 10 minutes per IP
      },
    ]),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RolePermissionsService,
    AuthorizationGuard,
    TokenBlacklistService,
  ],
  exports: [
    AuthService,
    RolePermissionsService,
    AuthorizationGuard,
    TokenBlacklistService,
  ],
})
export class AuthModule {}
