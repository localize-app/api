/* eslint-disable @typescript-eslint/no-unused-vars */
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        // If the user entity doesn't have toObject method, use spread operator directly
        const { passwordHash, ...result } = user as any;
        return result;
      }
    } catch (error) {
      // Handle user not found exception silently
      console.error('User not found:', error);

      // Optionally, you can throw an error or return null here
      throw new UnauthorizedException('Invalid credentials');
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    await this.usersService.updateLastLogin(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        company: user.company,
      },
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(
        { sub: user._id, email: user.email },
        { expiresIn: '7d' },
      ),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = { sub: user._id, email: user.email, role: user.role };
      return {
        access_token: this.jwtService.sign(newPayload, { expiresIn: '15m' }),
        refresh_token: this.jwtService.sign(
          { sub: user._id, email: user.email },
          { expiresIn: '7d' },
        ),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(registerDto: RegisterDto) {
    // Password will be hashed in the UsersService.create method
    const userDto: CreateUserDto = {
      email: registerDto.email,
      password: registerDto.password, // Send plain password - UsersService will hash it
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      role: Role.MEMBER,
    };

    const newUser = await this.usersService.create(userDto);

    // If the user entity doesn't have toObject method, use spread operator directly
    const { passwordHash, ...result } = newUser as any;
    return result;
  }
}
