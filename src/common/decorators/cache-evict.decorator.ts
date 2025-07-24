import { SetMetadata } from '@nestjs/common';

export const CACHE_EVICT_METADATA = 'cache_evict_metadata';

export interface CacheEvictOptions {
  keys?: string[];
  patterns?: string[];
  allEntries?: boolean;
}

/**
 * Decorator to evict cache entries
 */
export const CacheEvict = (options: CacheEvictOptions | string | string[]) => {
  const evictOptions: CacheEvictOptions =
    typeof options === 'string'
      ? { keys: [options] }
      : Array.isArray(options)
        ? { keys: options }
        : options;

  return SetMetadata(CACHE_EVICT_METADATA, evictOptions);
};
