import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  BlacklistedToken,
  BlacklistedTokenDocument,
} from '../entities/blacklisted-token.entity';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectModel(BlacklistedToken.name)
    private blacklistedTokenModel: Model<BlacklistedTokenDocument>,
    private jwtService: JwtService,
  ) {}

  async blacklistToken(
    token: string,
    tokenType: 'access' | 'refresh',
    userId: string,
  ): Promise<void> {
    try {
      const decoded: any = this.jwtService.decode(token);

      if (!decoded || !decoded.jti) {
        throw new Error('Invalid token - missing JTI');
      }

      await this.blacklistedTokenModel.create({
        jti: decoded.jti,
        userId,
        tokenType,
        expiresAt: new Date(decoded.exp * 1000), // Convert Unix timestamp to Date
      });
    } catch (error) {
      // Don't throw on duplicate key errors (token already blacklisted)
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded: any = this.jwtService.decode(token);

      if (!decoded || !decoded.jti) {
        return true; // Consider invalid tokens as blacklisted
      }

      const blacklistedToken = await this.blacklistedTokenModel.findOne({
        jti: decoded.jti,
      });

      return !!blacklistedToken;
    } catch (error) {
      return true; // Consider malformed tokens as blacklisted
    }
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    // This is more complex - we'd need to track all active tokens per user
    // For now, we'll implement a user-based token versioning approach
    // by updating the user's tokenVersion field
  }

  async cleanupExpiredTokens(): Promise<void> {
    // This will be handled automatically by MongoDB TTL index
    // But we can also manually clean up if needed
    await this.blacklistedTokenModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}
