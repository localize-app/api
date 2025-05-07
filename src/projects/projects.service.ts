/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

import { Project, ProjectDocument } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Generate a project key if not provided
    if (!createProjectDto.projectKey) {
      createProjectDto.projectKey = this.generateProjectKey();
    }

    const newProject = new this.projectModel(createProjectDto);
    return newProject.save();
  }

  async findAll(
    query: {
      company?: string;
      isArchived?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<Project[]> {
    const { company, isArchived, search, page = 1, limit = 100 } = query;

    // Build filter
    const filter: any = {};

    if (company) {
      filter.company = company;
    }

    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    return this.projectModel
      .find(filter)
      .skip(skip)
      .limit(+limit)
      .populate('company')
      .populate('members')
      .populate('phraseCount')
      .populate('pendingPhraseCount')
      .populate('publishedPhraseCount')
      .exec();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectModel
      .findById(id)
      .populate('company')
      .populate('members')
      .populate('phraseCount')
      .populate('pendingPhraseCount')
      .populate('publishedPhraseCount')

      .exec();

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, updateProjectDto, { new: true })
      .populate('company')
      .populate('members')
      .exec();

    if (!updatedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return updatedProject;
  }

  async remove(id: string): Promise<void> {
    const result = await this.projectModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }

  async addMember(id: string, userId: string): Promise<Project | null> {
    const project = await this.findOne(id);

    if (!project.members) {
      project.members = [];
    }

    // Check if user is already a member
    // @ts-ignore
    const isMember = project.members.some((member) => member.id === userId);

    if (!isMember) {
      return this.projectModel
        .findByIdAndUpdate(id, { $push: { members: userId } }, { new: true })
        .populate('company')
        .populate('members')
        .exec();
    }

    return project;
  }

  async removeMember(id: string, userId: string): Promise<Project | null> {
    return this.projectModel
      .findByIdAndUpdate(id, { $pull: { members: userId } }, { new: true })
      .populate('company')
      .populate('members')
      .exec();
  }

  async updateSettings(id: string, settings: any): Promise<Project | null> {
    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, { settings }, { new: true })
      .populate('company')
      .populate('members')
      .exec();

    if (!updatedProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return updatedProject;
  }

  private generateProjectKey(): string {
    return 'prj_' + crypto.randomBytes(16).toString('hex');
  }
}
