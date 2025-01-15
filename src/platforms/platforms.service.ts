import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { Platform, PlatformDocument } from './entities/platform.entity';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectModel(Platform.name) private platformModel: Model<PlatformDocument>,
  ) {}

  // Create a new platform
  async create(createPlatformDto: CreatePlatformDto): Promise<Platform> {
    const newPlatform = new this.platformModel(createPlatformDto);
    return newPlatform.save();
  }

  // Get all platforms
  async findAll(): Promise<Platform[]> {
    return this.platformModel.find().exec();
  }

  // Get a specific platform by ID
  async findOne(id: string): Promise<Platform> {
    const platform = await this.platformModel.findById(id).exec();
    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }
    return platform;
  }

  // Update a platform
  async update(
    id: string,
    updatePlatformDto: UpdatePlatformDto,
  ): Promise<Platform> {
    const updatedPlatform = await this.platformModel
      .findByIdAndUpdate(id, updatePlatformDto, { new: true })
      .exec();
    if (!updatedPlatform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }
    return updatedPlatform;
  }

  // Delete a platform
  async remove(id: string): Promise<void> {
    const result = await this.platformModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }
  }
}
