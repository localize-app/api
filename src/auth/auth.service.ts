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
    const payload = { email: user.email, sub: user._id, role: user.role };
    await this.usersService.updateLastLogin(user._id);

    return {
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isSystemAdmin: user.isSystemAdmin,
        permissions: user.permissions,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const hash = await bcrypt.hash(registerDto.password, 10);

    // Create a valid CreateUserDto object
    const userDto: CreateUserDto = {
      email: registerDto.email,
      password: hash,
      firstName: registerDto.firstName, // Changed from fullName
      lastName: registerDto.lastName, // Added lastName
      roles: [Role.MEMBER],
    };

    const newUser = await this.usersService.create(userDto);

    // If the user entity doesn't have toObject method, use spread operator directly
    const { passwordHash, ...result } = newUser as any;
    return result;
  }
}
