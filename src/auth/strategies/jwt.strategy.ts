// src/auth/strategies/jwt.strategy.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      // Extract JWT from both Authorization header AND cookies
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      passReqToCallback: true, // Pass request to validate method
    });
  }

  async validate(req: Request, payload: any) {
    // Check if payload and sub exist before trying to find the user
    if (!payload || !payload.sub) {
      console.error('❌ Invalid token payload - missing sub field. Payload:', payload);
      throw new UnauthorizedException('Invalid token payload');
    }

    // Extract token from request for blacklist check
    const tokenFromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const tokenFromCookie = req?.cookies?.access_token;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // SECURITY: Check if token is blacklisted
    const isBlacklisted =
      await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException(`User not found`);
    }

    // SECURITY: Check token version for session invalidation
    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Session invalidated - please login again',
      );
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
