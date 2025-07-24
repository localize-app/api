// src/common/guards/rate-limit.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../cache/cache.service';

export interface RateLimitOptions {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  keyPrefix?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, propertyKey?: string, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, target);
    return target;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get rate limit options from decorator
    const rateLimitOptions =
      this.reflector.get<RateLimitOptions>(
        RATE_LIMIT_KEY,
        context.getHandler(),
      ) ||
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getClass());

    if (!rateLimitOptions) {
      return true; // No rate limit configured
    }

    // Generate key based on user ID or IP
    const userId = request.user?.id;
    const ip = request.ip || request.connection.remoteAddress;
    const endpoint = `${context.getClass().name}.${context.getHandler().name}`;

    const key = userId
      ? `rate_limit:user:${userId}:${endpoint}`
      : `rate_limit:ip:${ip}:${endpoint}`;

    try {
      // Increment counter
      const current = await this.cacheService.increment(key, 1, {
        ttl: rateLimitOptions.duration,
      });

      // Check if limit exceeded
      if (current > rateLimitOptions.points) {
        const ttl = await this.getTTL(key);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests',
            error: 'Rate limit exceeded',
            retryAfter: ttl,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Add rate limit headers
      request.res.setHeader('X-RateLimit-Limit', rateLimitOptions.points);
      request.res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, rateLimitOptions.points - current),
      );
      request.res.setHeader(
        'X-RateLimit-Reset',
        new Date(Date.now() + rateLimitOptions.duration * 1000).toISOString(),
      );

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // If Redis is down, allow the request
      console.error('Rate limit check failed:', error);
      return true;
    }
  }

  private async getTTL(key: string): Promise<number> {
    try {
      const redisClient = (
        this.cacheService as any
      ).cacheManager.store.getClient();
      return await redisClient.ttl(key);
    } catch {
      return 0;
    }
  }
}

// Usage in controller:
// @Controller('api/phrases')
// @RateLimit({ points: 100, duration: 60 }) // 100 requests per minute for all endpoints
// export class PhrasesController {
//   @Post('extract')
//   @RateLimit({ points: 10, duration: 60 }) // 10 requests per minute for this endpoint
//   async extractPhrases(@Body() dto: ExtractPhrasesDto) {
//     // ...
//   }
// }
