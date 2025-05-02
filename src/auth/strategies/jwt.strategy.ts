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

    console.log('JWT payload:', payload);

    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException(`User not found`);
    }

    // Remove sensitive information
    const { passwordHash, ...result } = user;

    return result;
  }
}
