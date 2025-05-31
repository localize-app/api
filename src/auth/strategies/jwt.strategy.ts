// src/auth/strategies/jwt.strategy.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    // Check if payload and sub exist before trying to find the user
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException(`User not found`);
    }

    // Remove sensitive information but keep permissions for authorization
    const { passwordHash, ...result } = user;

    // Ensure permissions are included in the user object for the authorization guard
    return {
      ...result,
      permissions: user.permissions, // This is now the stored permissions from DB
    };
  }
}
