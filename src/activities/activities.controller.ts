// src/activity/activity.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activityService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activityService.create(createActivityDto);
  }

  @Get()
  async findAll(
    @Res({ passthrough: true }) res: Response,
    @Query() query: ActivityQueryDto,
  ) {
    try {
      const { activities, total } = await this.activityService.findAll(query);
      const limit = query.limit || 20;
      const page = query.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + activities.length - 1, total - 1);

      res
        .status(HttpStatus.OK)
        .header(
          'Content-Range',
          `activities ${startIndex}-${endIndex}/${total}`,
        );

      return activities;
    } catch (e) {
      console.log(e);
    }
  }
}
