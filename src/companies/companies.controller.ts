import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateOrganizationLimitsDto } from './dto/update-organization-limits.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Role } from 'src/common/enums/role.enum';
import { CompanyWithUsersDto } from './dto/company-with-users.dto';

@ApiTags('Companies')
@ApiBearerAuth() // Add bearer auth to Swagger docs
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(Role.SYSTEM_ADMIN)
  @RequirePermission('canManageCompanies')
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: 201,
    description: 'Company successfully created',
    type: CompanyWithUsersDto,
  })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(Role.SYSTEM_ADMIN)
  @RequirePermission('canViewCompanies')
  @ApiOperation({ summary: 'Get all companies with their users' })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of companies with user data',
    type: [CompanyWithUsersDto],
  })
  async findAll(@Res({ passthrough: true }) res: Response) {
    try {
      const list = await this.companiesService.findAll();
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `companies 0-${list?.length}/${list?.length}`);
      return list;
    } catch (e) {
      console.log(e);
    }
  }

  @Get(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiOperation({ summary: 'Get a company by ID with its users' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a company with user data',
    type: CompanyWithUsersDto,
  })
  findOne(@Param('id') id: string, @Req() req: Request) {
    // Company owners can only access their own company details
    if ((req.user as any).role === Role.COMPANY_OWNER) {
      const userCompany = (req.user as any).company;
      const userCompanyId = typeof userCompany === 'object' 
        ? userCompany.id || userCompany._id 
        : userCompany;
      if (userCompanyId && userCompanyId.toString() !== id) {
        throw new HttpException('Access denied: You can only view your own company details', HttpStatus.FORBIDDEN);
      }
    }
    
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Company successfully updated',
    type: CompanyWithUsersDto,
  })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Req() req: Request) {
    // Company owners can only update their own company
    if ((req.user as any).role === Role.COMPANY_OWNER) {
      const userCompany = (req.user as any).company;
      const userCompanyId = typeof userCompany === 'object' 
        ? userCompany.id || userCompany._id 
        : userCompany;
      if (userCompanyId && userCompanyId.toString() !== id) {
        throw new HttpException('Access denied: You can only update your own company', HttpStatus.FORBIDDEN);
      }
    }
    
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(Role.SYSTEM_ADMIN) // Only admin role can delete companies
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company successfully deleted' })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  @Post(':id/users/:userId')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiOperation({ summary: 'Add a user to a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully added to company',
    type: CompanyWithUsersDto,
  })
  addUser(@Param('id') id: string, @Param('userId') userId: string, @Req() req: Request) {
    // Company owners can only add users to their own company
    if ((req.user as any).role === Role.COMPANY_OWNER) {
      const userCompany = (req.user as any).company;
      const userCompanyId = typeof userCompany === 'object' 
        ? userCompany.id || userCompany._id 
        : userCompany;
      if (userCompanyId && userCompanyId.toString() !== id) {
        throw new HttpException('Access denied: You can only add users to your own company', HttpStatus.FORBIDDEN);
      }
    }
    
    return this.companiesService.addUser(id, userId);
  }

  @Delete(':id/users/:userId')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiOperation({ summary: 'Remove a user from a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User successfully removed from company',
    type: CompanyWithUsersDto,
  })
  removeUser(@Param('id') id: string, @Param('userId') userId: string, @Req() req: Request) {
    // Company owners can only remove users from their own company
    if ((req.user as any).role === Role.COMPANY_OWNER) {
      const userCompany = (req.user as any).company;
      const userCompanyId = typeof userCompany === 'object' 
        ? userCompany.id || userCompany._id 
        : userCompany;
      if (userCompanyId && userCompanyId.toString() !== id) {
        throw new HttpException('Access denied: You can only remove users from your own company', HttpStatus.FORBIDDEN);
      }
    }
    
    return this.companiesService.removeUser(id, userId);
  }

  // System Admin Organization Management Endpoints

  @Get('admin/organizations')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Get all organizations with limits and usage stats (System Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all organizations with their limits and current usage',
  })
  async getOrganizationsWithLimits(@Res({ passthrough: true }) res: Response) {
    try {
      const organizations = await this.companiesService.getAllOrganizationsWithLimits();
      res
        .status(HttpStatus.OK)
        .header('Content-Range', `organizations 0-${organizations?.length}/${organizations?.length}`);
      return organizations;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Patch(':id/limits')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Update organization limits and status (System Admin)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization limits successfully updated',
    type: CompanyWithUsersDto,
  })
  updateOrganizationLimits(
    @Param('id') id: string,
    @Body() updateLimitsDto: UpdateOrganizationLimitsDto,
    @Req() req: Request,
  ) {
    const adminUserId = (req.user as any)._id;
    return this.companiesService.updateOrganizationLimits(id, updateLimitsDto, adminUserId);
  }

  @Post(':id/deactivate')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Deactivate an organization (System Admin)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization successfully deactivated',
    type: CompanyWithUsersDto,
  })
  deactivateOrganization(@Param('id') id: string, @Req() req: Request) {
    const adminUserId = (req.user as any)._id;
    return this.companiesService.deactivateOrganization(id, adminUserId);
  }

  @Post(':id/activate')
  @Roles(Role.SYSTEM_ADMIN)
  @ApiOperation({ summary: 'Activate an organization (System Admin)' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization successfully activated',
    type: CompanyWithUsersDto,
  })
  activateOrganization(@Param('id') id: string, @Req() req: Request) {
    const adminUserId = (req.user as any)._id;
    return this.companiesService.activateOrganization(id, adminUserId);
  }

  @Get(':id/limits')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @ApiOperation({ summary: 'Check organization limits and current usage' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns organization limits and usage information',
  })
  async checkOrganizationLimits(@Param('id') id: string, @Req() req: Request) {
    // Company owners can only check limits for their own company
    if ((req.user as any).role === Role.COMPANY_OWNER) {
      const userCompany = (req.user as any).company;
      const userCompanyId = typeof userCompany === 'object' 
        ? userCompany.id || userCompany._id 
        : userCompany;
      if (userCompanyId && userCompanyId.toString() !== id) {
        throw new HttpException('Access denied: You can only check limits for your own company', HttpStatus.FORBIDDEN);
      }
    }
    
    const canAddProject = await this.companiesService.canAddProject(id);
    const canAddTeamMember = await this.companiesService.canAddTeamMember(id);
    
    return {
      canAddProject,
      canAddTeamMember,
    };
  }
}
