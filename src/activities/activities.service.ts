// src/activity/activity.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivityDocument } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const newActivity = new this.activityModel(createActivityDto);
    return newActivity.save();
  }

  async findAll(
    query: ActivityQueryDto,
  ): Promise<{ activities: Activity[]; total: number }> {
    const {
      user,
      company,
      project,
      actionType,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    // Build filter
    const filter: any = {};

    if (user) {
      filter.user = user;
    }

    if (company) {
      filter.company = company;
    }

    if (project) {
      filter.project = project;
    }

    if (actionType && actionType !== 'all') {
      filter.actionType = actionType;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};

      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.activityModel.countDocuments(filter).exec();

    // Get paginated results
    const activities = await this.activityModel
      .find(filter)
      .sort({ timestamp: -1 }) // Most recent first
      .skip(skip)
      .limit(+limit)
      .populate('user', 'firstName lastName email')
      .populate('company', 'name')
      .populate('project', 'name')
      .exec();

    return { activities, total };
  }

  async logActivity(
    userId: string,
    actionType: string,
    companyId: string,
    details: Record<string, any> = {},
    entityId?: string,
    entityType?: string,
    projectId?: string,
  ): Promise<Activity> {
    const activity = new this.activityModel({
      user: userId,
      actionType,
      company: companyId,
      details,
      timestamp: new Date(),
      ...(entityId && { entityId }),
      ...(entityType && { entityType }),
      ...(projectId && { project: projectId }),
    });

    return activity.save();
  }
}
