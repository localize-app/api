// src/cache/cache.controller.ts
import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { CacheService } from './cache.service';
import { Role } from 'src/common/enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CacheMetricsService } from './cache-metrics.service';

@ApiTags('Cache Management')
@Controller('api/cache')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CacheController {
  constructor(
    private cacheService: CacheService,
    private cacheMetricsService: CacheMetricsService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get cache metrics' })
  @Roles(Role.ADMIN)
  getMetrics() {
    return this.cacheMetricsService.getMetrics();
  }

  @Delete('flush')
  @ApiOperation({ summary: 'Flush all cache' })
  @Roles(Role.ADMIN)
  async flushAll() {
    await this.cacheService.reset();
    return { message: 'Cache flushed successfully' };
  }

  @Delete('pattern/:pattern')
  @ApiOperation({ summary: 'Delete cache by pattern' })
  @Roles(Role.ADMIN)
  async deleteByPattern(@Param('pattern') pattern: string) {
    await this.cacheService.reset(pattern);
    return { message: `Cache cleared for pattern: ${pattern}` };
  }
}
