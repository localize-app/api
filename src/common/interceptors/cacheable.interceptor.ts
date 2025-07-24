import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../cache/cache.service';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../decorators/cache.decorator';

@Injectable()
export class CacheableInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheService.set(cacheKey, data, { ttl: cacheTTL });
      }),
    );
  }
}
