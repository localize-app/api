// src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
  @RequirePermission('canViewDashboard')
  async getDashboardStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
  @RequirePermission('canViewAnalytics')
  async getAnalytics() {
    return this.dashboardService.getAnalytics();
  }
}
