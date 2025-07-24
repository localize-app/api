// src/cache/cache-warmer.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProjectsService } from '../projects/projects.service';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../users/users.service';
import { CacheService } from './cache.service';

@Injectable()
export class CacheWarmerService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmerService.name);

  constructor(
    private cacheService: CacheService,
    private projectsService: ProjectsService,
    private companiesService: CompaniesService,
    private usersService: UsersService,
  ) {}

  async onModuleInit() {
    // Optionally warm cache on startup
    if (process.env.WARM_CACHE_ON_STARTUP === 'true') {
      await this.warmCache();
    }
  }

  /**
   * Warm cache every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCacheWarming() {
    this.logger.log('Starting scheduled cache warming...');
    await this.warmCache();
  }

  /**
   * Warm frequently accessed data
   */
  async warmCache(): Promise<void> {
    try {
      const startTime = Date.now();

      // Warm projects cache
      await this.warmProjectsCache();

      // Warm companies cache
      await this.warmCompaniesCache();

      // // Warm active users cache
      // await this.warmActiveUsersCache();

      const duration = Date.now() - startTime;
      this.logger.log(`Cache warming completed in ${duration}ms`);
    } catch (error) {
      this.logger.error('Cache warming failed:', error);
    }
  }

  private async warmProjectsCache(): Promise<void> {
    try {
      // Get all projects
      const projects = await this.projectsService.findAll();

      // Cache individual projects
      for (const project of projects) {
        await this.cacheService.set(`projects:${project._id}`, project, {
          ttl: 600,
        });
      }

      // Cache project list
      await this.cacheService.set('projects:list:all', projects, { ttl: 600 });

      this.logger.log(`Warmed cache for ${projects.length} projects`);
    } catch (error) {
      this.logger.error('Failed to warm projects cache:', error);
    }
  }

  private async warmCompaniesCache(): Promise<void> {
    try {
      const companies = await this.companiesService.findAll();

      for (const company of companies) {
        await this.cacheService.set(
          `companies:${company._id}`,
          company,
          { ttl: 900 }, // 15 minutes
        );
      }

      this.logger.log(`Warmed cache for ${companies.length} companies`);
    } catch (error) {
      this.logger.error('Failed to warm companies cache:', error);
    }
  }

  // private async warmActiveUsersCache(): Promise<void> {
  //   try {
  //     // Get recently active users (you'd implement this method)
  //     const activeUsers = await this.usersService.findRecentlyActive();

  //     for (const user of activeUsers) {
  //       await this.cacheService.set(
  //         `users:${user._id}`,
  //         user,
  //         { ttl: 300 }, // 5 minutes
  //       );
  //     }

  //     this.logger.log(`Warmed cache for ${activeUsers.length} active users`);
  //   } catch (error) {
  //     this.logger.error('Failed to warm users cache:', error);
  //   }
  // }

  /**
   * Manually trigger cache warming
   */
  async warmSpecificData(
    type: 'projects' | 'companies' | 'users',
  ): Promise<void> {
    switch (type) {
      case 'projects':
        await this.warmProjectsCache();
        break;
      case 'companies':
        await this.warmCompaniesCache();
        break;
      // case 'users':
      //   await this.warmActiveUsersCache();
      // break;
    }
  }
}
