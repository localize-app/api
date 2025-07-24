import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private cacheService: CacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to set and get a value
      const testKey = 'health-check';
      const testValue = Date.now().toString();

      await this.cacheService.set(testKey, testValue, { ttl: 10 });
      const retrieved = await this.cacheService.get<string>(testKey);

      if (retrieved !== testValue) {
        throw new Error('Redis read/write test failed');
      }

      await this.cacheService.del(testKey);

      return this.getStatus(key, true, { status: 'up' });
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error.message,
        }),
      );
    }
  }
}
