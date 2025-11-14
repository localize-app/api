import { Request, Response } from 'express';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public() // Mark as public so it's accessible without authentication
  @UseGuards(LocalAuthGuard) // Rate limit login attempts
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Return user data and set secure cookies',
  })
  @Post('login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, res);
  }

  @Public() // Mark as public so it's accessible without authentication
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Return user data and set new secure cookies',
  })
  @UseGuards(ThrottlerGuard) // Rate limit refresh attempts
  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Debug logging to see what cookies are being sent
    console.log('🍪 Refresh request cookies:', req.cookies);
    console.log('📋 All headers:', req.headers);

    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      console.log('❌ No refresh token found in cookies');
      throw new UnauthorizedException('Refresh token not provided');
    }

    console.log('✅ Found refresh token, attempting refresh');
    // Don't pass userId since it's extracted from the refresh token itself
    return this.authService.refreshToken(refreshToken, res);
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;
    const userId = (req.user as any)?._id;

    await this.authService.logout(accessToken, refreshToken, res, userId);

    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return the current user profile' })
  @Get('profile')
  async getProfile(@Req() req: Request) {
    return this.authService.getUserProfile(req.user);
  }
}
