// src/dashboard/dashboard.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
  async getDashboardStats(@Request() req: any) {
    return this.dashboardService.getStats(req.user);
  }

  @Get('analytics')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER, Role.MEMBER)
  @RequirePermission('canViewAnalytics')
  async getAnalytics(@Request() req: any) {
    return this.dashboardService.getAnalytics(req.user);
  }
}
