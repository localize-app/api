// src/cache/cache.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly defaultTTL = 300; // 5 minutes

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Build cache key with optional prefix
   */
  private buildKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | undefined> {
    const cacheKey = this.buildKey(key, options?.prefix);
    try {
      const value = await this.cacheManager.get<T>(cacheKey);
      if (value) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${cacheKey}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const cacheKey = this.buildKey(key, options?.prefix);
    const ttl = options?.ttl ?? this.defaultTTL;

    try {
      await this.cacheManager.set(cacheKey, value, ttl);
      this.logger.debug(`Cache set: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string | string[], options?: CacheOptions): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];

    try {
      await Promise.all(
        keys.map((k) => {
          const cacheKey = this.buildKey(k, options?.prefix);
          this.logger.debug(`Cache delete: ${cacheKey}`);
          return this.cacheManager.del(cacheKey);
        }),
      );
    } catch (error) {
      this.logger.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache or by pattern (Redis only)
   */
  async reset(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // Redis-specific pattern deletion
        const redisClient = (this.cacheManager.stores as any).getClient();
        const keys = await redisClient.keys(`localize:${pattern}`);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          this.logger.debug(
            `Deleted ${keys.length} keys matching pattern: ${pattern}`,
          );
        }
      } else {
        // await this.cacheManager.reset();
        this.logger.debug('Cache reset completed');
      }
    } catch (error) {
      this.logger.error('Cache reset error:', error);
    }
  }

  /**
   * Cache-aside pattern implementation
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== undefined) {
      return cached;
    }

    // If not in cache, execute factory function
    const value = await factory();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  /**
   * Get multiple values
   */
  async mget<T>(
    keys: string[],
    options?: CacheOptions,
  ): Promise<(T | undefined)[]> {
    try {
      const promises = keys.map((key) => this.get<T>(key, options));
      return await Promise.all(promises);
    } catch (error) {
      this.logger.error('Cache mget error:', error);
      return keys.map(() => undefined);
    }
  }

  /**
   * Set multiple values
   */
  async mset<T>(
    items: { key: string; value: T }[],
    options?: CacheOptions,
  ): Promise<void> {
    try {
      await Promise.all(
        items.map(({ key, value }) => this.set(key, value, options)),
      );
    } catch (error) {
      this.logger.error('Cache mset error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== undefined;
  }

  /**
   * Increment counter (Redis atomic operation)
   */
  async increment(
    key: string,
    value = 1,
    options?: CacheOptions,
  ): Promise<number> {
    const cacheKey = this.buildKey(key, options?.prefix);
    try {
      const redisClient = (this.cacheManager.stores as any).getClient();
      const result = await redisClient.incrby(cacheKey, value);

      // Set TTL if this is a new key
      if (result === value && options?.ttl) {
        await redisClient.expire(cacheKey, options.ttl);
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache increment error for key ${cacheKey}:`, error);
      throw error;
    }
  }
}
