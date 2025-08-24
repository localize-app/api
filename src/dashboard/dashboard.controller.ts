// src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.dashboardService.getAnalytics();
  }
}