import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  Request,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequirePermission } from '../auth/decorators/permission.decorator';

@ApiTags('Projects')
@ApiBearerAuth() // Add bearer auth to Swagger docs
@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canCreateProjects')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
  })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ) {
    try {
      console.log('Creating project:', createProjectDto);

      // Company owners can only create projects for their own company
      if (req.user.role === Role.COMPANY_OWNER && req.user.company) {
        // Extract the company ID from the company object if it's an object
        const companyId =
          typeof req.user.company === 'object'
            ? req.user.company.id || req.user.company._id
            : req.user.company;
        createProjectDto.company = companyId;
      }

      return await this.projectsService.create(createProjectDto);
    } catch (error) {
      this.logger.error(
        `Failed to create project: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create project: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with optional filtering' })
  @ApiQuery({
    name: 'company',
    required: false,
    description: 'Filter by company ID',
  })
  @ApiQuery({
    name: 'isArchived',
    required: false,
    description: 'Filter by archive status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in name and description',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page for pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'List of projects retrieved successfully.',
  })
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: any,
    @Request() req: any,
  ) {
    try {
      // Company owners can only see projects from their own company
      if (req.user.role === Role.COMPANY_OWNER && req.user.company) {
        // Extract the company ID from the company object if it's an object
        const companyId =
          typeof req.user.company === 'object'
            ? req.user.company.id || req.user.company._id
            : req.user.company;
        query.company = companyId;
      }
      // System admins see all projects (no filtering)

      const list = await this.projectsService.findAll(query);
      console.log('Projects list:', list);

      res
        .status(HttpStatus.OK)
        .header('Content-Range', `projects 0-${list?.length}/${list?.length}`);
      return list;
    } catch (error) {
      this.logger.error(
        `Failed to fetch projects: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to fetch projects: ${error.message}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully.' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.projectsService.findOne(id);
    } catch (error) {
      this.logger.error(
        `Failed to fetch project with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch project with ID ${id}: ${error.message}`,
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageProjects')
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: 'Project updated successfully.' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    try {
      return await this.projectsService.update(id, updateProjectDto);
    } catch (error) {
      this.logger.error(
        `Failed to update project with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update project with ID ${id}: ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canArchiveProjects')
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.projectsService.remove(id);
    } catch (error) {
      this.logger.error(
        `Failed to delete project with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to delete project with ID ${id}: ${error.message}`,
        error.status || HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post(':id/members/:userId')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageProjects')
  @ApiOperation({ summary: 'Add member to project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to add as member' })
  @ApiResponse({ status: 200, description: 'Member added successfully.' })
  async addMember(@Param('id') id: string, @Param('userId') userId: string) {
    try {
      return await this.projectsService.addMember(id, userId);
    } catch (error) {
      this.logger.error(
        `Failed to add member ${userId} to project ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to add member to project: ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id/members/:userId')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageProjects')
  @ApiOperation({ summary: 'Remove member from project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove from members' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid operation.' })
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    try {
      return await this.projectsService.removeMember(id, userId);
    } catch (error) {
      this.logger.error(
        `Failed to remove member ${userId} from project ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to remove member from project: ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id/settings')
  @Roles(Role.SYSTEM_ADMIN, Role.COMPANY_OWNER)
  @RequirePermission('canManageProjects')
  @ApiOperation({ summary: 'Update project settings' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiBody({ description: 'Project settings object' })
  @ApiResponse({
    status: 200,
    description: 'Project settings updated successfully.',
  })
  async updateSettings(@Param('id') id: string, @Body() settings: any) {
    try {
      return await this.projectsService.updateSettings(id, settings);
    } catch (error) {
      this.logger.error(
        `Failed to update settings for project ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to update project settings: ${error.message}`,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
