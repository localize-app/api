/* eslint-disable @typescript-eslint/no-unused-vars */
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Role } from '../common/enums/role.enum';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { RolePermissionsService } from './role-permission.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private rolePermissionsService: RolePermissionsService,
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

  async login(user: any, response: Response) {
    try {
      const jti = uuidv4(); // Unique token ID for blacklisting
      const refreshJti = uuidv4();

      // Handle both _id and id fields from user object
      const userId = user._id || user.id;
      if (!userId) {
        console.error('❌ User object missing ID field:', user);
        throw new Error('User ID is required for token generation');
      }

      const payload = {
        email: user.email,
        sub: userId.toString(), // Ensure it's a string
        role: user.role,
        jti, // JWT ID for token tracking
        tokenVersion: user.tokenVersion || 0,
      };

      const refreshPayload = {
        sub: userId.toString(), // Ensure it's a string
        email: user.email,
        jti: refreshJti,
        tokenVersion: user.tokenVersion || 0,
        type: 'refresh', // Mark as refresh token
      };

      console.log('🔐 Generating tokens with payload:', payload);
      console.log('👤 User object keys:', Object.keys(user));

      await this.usersService.updateLastLogin(userId);

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: '7d',
      });

      console.log('✅ Tokens generated successfully');

      // Set secure httpOnly cookies
      this.setSecureTokenCookies(response, accessToken, refreshToken);

      return {
        user: {
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName,
          role: user.role,
          permissions: user.permissions,
          company: user.company,
        },
      };
    } catch (error) {
      console.error(error);
    }
  }

  async refreshToken(refreshToken: string, response: Response) {
    try {
      // Check if token is blacklisted first
      if (await this.tokenBlacklistService.isTokenBlacklisted(refreshToken)) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const payload = this.jwtService.verify(refreshToken);

      // Validate token type
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findByEmail(payload.email);

      // Handle both _id and id fields from user object
      const userId = user?._id || user?.id;
      if (!user || !userId || userId.toString() !== payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check token version (for session invalidation)
      if (payload.tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException(
          'Token version mismatch - session invalidated',
        );
      }

      // SECURITY: Blacklist the old refresh token (token rotation)
      await this.tokenBlacklistService.blacklistToken(
        refreshToken,
        'refresh',
        userId.toString(),
      );

      // Generate new token pair
      const newJti = uuidv4();
      const newRefreshJti = uuidv4();

      const newPayload = {
        sub: userId.toString(),
        email: user.email,
        role: user.role,
        jti: newJti,
        tokenVersion: user.tokenVersion,
      };

      const newRefreshPayload = {
        sub: userId.toString(),
        email: user.email,
        jti: newRefreshJti,
        tokenVersion: user.tokenVersion,
        type: 'refresh',
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newRefreshPayload, {
        expiresIn: '7d',
      });

      // Set new secure cookies
      this.setSecureTokenCookies(response, newAccessToken, newRefreshToken);

      return {
        user: {
          id: userId.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName,
          role: user.role,
          permissions: user.permissions,
          company: user.company,
        },
      };
    } catch (error) {
      // Check if it's a JWT-related error (expired, invalid, malformed)
      // JWT errors have specific names: 'TokenExpiredError' or 'JsonWebTokenError'
      const errorName = error?.name || error?.constructor?.name;
      const isJwtError =
        errorName === 'TokenExpiredError' ||
        errorName === 'JsonWebTokenError' ||
        error?.message?.includes('jwt expired') ||
        error?.message?.includes('invalid token');

      // Check if it's an authentication-related UnauthorizedException
      const isAuthError = error instanceof UnauthorizedException;

      // Only clear cookies for JWT errors or auth errors (expired/invalid tokens)
      // Don't clear cookies on unexpected errors (database failures, etc.)
      if (isJwtError || isAuthError) {
        this.clearTokenCookies(response);

        // Provide specific error messages
        if (errorName === 'TokenExpiredError' || error?.message?.includes('jwt expired')) {
          throw new UnauthorizedException('Refresh token expired - please login again');
        } else if (errorName === 'JsonWebTokenError' || error?.message?.includes('invalid token')) {
          throw new UnauthorizedException('Invalid refresh token');
        } else if (error instanceof UnauthorizedException) {
          // Re-throw auth errors with their original message
          throw error;
        } else {
          throw new UnauthorizedException('Invalid refresh token');
        }
      } else {
        // For unexpected errors (database, network, etc.), log and re-throw
        // Don't clear cookies as this might be a temporary issue
        console.error('Unexpected error during token refresh:', error);
        throw new UnauthorizedException('Unable to refresh token - please try again');
      }
    }
  }

  async logout(
    accessToken: string,
    refreshToken: string,
    response: Response,
    userId: string,
  ) {
    try {
      // Blacklist both tokens
      if (accessToken) {
        await this.tokenBlacklistService.blacklistToken(
          accessToken,
          'access',
          userId,
        );
      }
      if (refreshToken) {
        await this.tokenBlacklistService.blacklistToken(
          refreshToken,
          'refresh',
          userId,
        );
      }
    } catch (error) {
      // Log error but don't fail logout
      console.error('Error blacklisting tokens during logout:', error);
    }

    // Clear cookies regardless
    this.clearTokenCookies(response);
  }

  async invalidateAllUserSessions(userId: string) {
    // Increment user's token version to invalidate all existing tokens
    await this.usersService.incrementTokenVersion(userId);
  }

  private setSecureTokenCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? ('strict' as const) : ('lax' as const), // Lax for dev, strict for prod
      path: '/',
    };

    console.log('🍪 Setting cookies with options:', cookieOptions);
    console.log('🔑 Access token length:', accessToken.length);
    console.log('🔄 Refresh token length:', refreshToken.length);

    response.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    response.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('✅ Cookies set successfully');
  }

  private clearTokenCookies(response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('strict' as const) : ('lax' as const),
      path: '/',
    };

    response.clearCookie('access_token', cookieOptions);
    response.clearCookie('refresh_token', cookieOptions);
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

  async getUserProfile(user: any) {
    console.log('🔍 getUserProfile called with user:', {
      id: user._id || user.id,
      email: user.email,
      role: user.role,
      hasStoredPermissions: !!user.permissions,
    });

    // Get permissions for the user's role (ignore custom permissions for now)
    const rolePermissions = this.rolePermissionsService.getPermissionsForRole(
      user.role,
    );

    console.log('🔑 Role-based permissions:', rolePermissions);

    // Return user data with calculated permissions
    const { passwordHash, ...userWithoutPassword } = user;
    const result = {
      ...userWithoutPassword,
      permissions: rolePermissions,
      isSystemAdmin: user.role === 'SYSTEM_ADMIN',
    };

    console.log('✅ getUserProfile returning user with permissions');

    return result;
  }
}
