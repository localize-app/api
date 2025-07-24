import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

/**
 * Decorator to set cache key
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);

/**
 * Decorator to set cache TTL
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Combined cache decorator
 */
export const Cacheable = (key: string, ttl?: number) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    CacheKey(key)(target, propertyName, descriptor);
    if (ttl) {
      CacheTTL(ttl)(target, propertyName, descriptor);
    }
  };
};
