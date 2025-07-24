// src/cache/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD') || undefined,
        ttl: configService.get('REDIS_TTL', 300), // Default 5 minutes
        max: configService.get('REDIS_MAX_ITEMS', 1000),
        // Redis specific options
        db: 0,
        keyPrefix: 'localize:',
        // Connection error handling
        onClientReady: (client: any) => {
          client.on('error', (error: any) => {
            console.error('Redis Client Error:', error);
          });
          client.on('connect', () => {
            console.log('Redis Client Connected');
          });
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
