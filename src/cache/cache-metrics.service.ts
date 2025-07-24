// src/cache/cache-metrics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CacheService } from './cache.service';
// import { PrometheusService } from '../monitoring/prometheus.service';

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  keysCount: number;
  connectedClients: number;
}

@Injectable()
export class CacheMetricsService {
  private readonly logger = new Logger(CacheMetricsService.name);
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    memoryUsage: 0,
    keysCount: 0,
    connectedClients: 0,
  };

  constructor(
    private cacheService: CacheService,
    // private prometheusService: PrometheusService,
  ) {}

  /**
   * Collect metrics every 30 seconds
   */
  @Interval(30000)
  async collectMetrics() {
    try {
      const redisClient = (
        this.cacheService as any
      ).cacheManager.store.getClient();
      const info = await redisClient.info('stats');
      const memInfo = await redisClient.info('memory');
      const keyspaceInfo = await redisClient.info('keyspace');

      // Parse Redis INFO response
      const stats = this.parseRedisInfo(info);
      const memory = this.parseRedisInfo(memInfo);
      const keyspace = this.parseRedisInfo(keyspaceInfo);

      // Update metrics
      this.metrics.hits = parseInt(stats.keyspace_hits || '0');
      this.metrics.misses = parseInt(stats.keyspace_misses || '0');
      this.metrics.evictions = parseInt(stats.evicted_keys || '0');
      this.metrics.hitRate = this.calculateHitRate();
      this.metrics.memoryUsage = parseInt(memory.used_memory || '0');
      this.metrics.keysCount = this.getTotalKeys(keyspace);
      this.metrics.connectedClients = parseInt(stats.connected_clients || '0');

      // Send to Prometheus
      this.exportMetrics();

      this.logger.debug('Cache metrics collected', this.metrics);
    } catch (error) {
      this.logger.error('Failed to collect cache metrics:', error);
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  private calculateHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  private getTotalKeys(keyspace: Record<string, string>): number {
    let total = 0;
    for (const [key, value] of Object.entries(keyspace)) {
      if (key.startsWith('db')) {
        const match = value.match(/keys=(\d+)/);
        if (match) {
          total += parseInt(match[1]);
        }
      }
    }
    return total;
  }

  private exportMetrics() {
    // Export to Prometheus
    // this.prometheusService.cacheHits.set(this.metrics.hits);
    // this.prometheusService.cacheMisses.set(this.metrics.misses);
    // this.prometheusService.cacheEvictions.set(this.metrics.evictions);
    // this.prometheusService.cacheHitRate.set(this.metrics.hitRate);
    // this.prometheusService.cacheMemoryUsage.set(this.metrics.memoryUsage);
    // this.prometheusService.cacheKeysCount.set(this.metrics.keysCount);
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Record cache operation
   */
  recordHit() {
    this.metrics.hits++;
  }

  recordMiss() {
    this.metrics.misses++;
  }
}
