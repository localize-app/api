// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permission.decorator';
import { Role } from 'src/common/enums/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolePermissionsService } from 'src/auth/role-permission.service';
import { PermissionsResponseDto } from './dto/permissions-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  @Public() // Mark as public so it's accessible without authentication
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns an array of users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns a user' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.SYSTEM_ADMIN)
  @RequirePermission('canRemoveUsers')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/company/:companyId')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Set the company for a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'User company successfully updated',
  })
  setCompany(@Param('id') id: string, @Param('companyId') companyId: string) {
    return this.usersService.updateCompany(id, companyId);
  }

  // NEW PERMISSION MANAGEMENT ENDPOINTS

  @Get(':id/permissions')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Get user permissions with role defaults' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns user permissions and role defaults',
    type: PermissionsResponseDto,
  })
  async getUserPermissions(
    @Param('id') id: string,
  ): Promise<PermissionsResponseDto> {
    const user = await this.usersService.findOne(id);
    const effectivePermissions =
      await this.usersService.getEffectivePermissions(id);
    const roleDefaults = this.rolePermissionsService.createDefaultPermissions(
      user.role,
    );

    return {
      userId: user.id || user._id?.toString() || '',
      role: user.role,
      hasCustomPermissions: user.hasCustomPermissions || false,
      permissionsLastUpdated: user.permissionsLastUpdated || new Date(),
      permissions: effectivePermissions,
      roleDefaults,
    };
  }

  @Patch(':id/permissions')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Update user permissions' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User permissions successfully updated',
  })
  updatePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
  ) {
    return this.usersService.updatePermissions(id, updatePermissionsDto);
  }

  @Post(':id/permissions/reset')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Reset user permissions to role defaults' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User permissions reset to role defaults',
  })
  resetPermissions(@Param('id') id: string) {
    return this.usersService.resetPermissionsToRoleDefaults(id);
  }

  @Get('roles/:role/permissions')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageUsers')
  @ApiOperation({ summary: 'Get default permissions for a role' })
  @ApiParam({ name: 'role', description: 'Role name', enum: Role })
  @ApiResponse({
    status: 200,
    description: 'Returns default permissions for the role',
  })
  getRolePermissions(@Param('role') role: string) {
    return {
      role,
      permissions: this.rolePermissionsService.createDefaultPermissions(role),
    };
  }
}
