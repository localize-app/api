// src/projects/projects.controller.ts
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
  HttpStatus,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() createProjectDto: CreateProjectDto) {
    try {
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
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: any,
  ) {
    try {
      const list = await this.projectsService.findAll(query);
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
