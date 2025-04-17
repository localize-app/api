import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import {
  Integration,
  IntegrationDocument,
} from './entities/integration.entity';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectModel(Integration.name)
    private integrationModel: Model<IntegrationDocument>,
  ) {}

  async create(
    createIntegrationDto: CreateIntegrationDto,
  ): Promise<Integration> {
    const newIntegration = new this.integrationModel(createIntegrationDto);
    return newIntegration.save();
  }

  async findAll(query: any = {}): Promise<Integration[]> {
    const { project, type, isEnabled } = query;

    // Build filter
    const filter: any = {};

    if (project) {
      filter.project = project;
    }

    if (type) {
      filter.type = type;
    }

    if (isEnabled !== undefined) {
      filter.isEnabled = isEnabled === 'true';
    }

    return this.integrationModel.find(filter).populate('project').exec();
  }

  async findOne(id: string): Promise<Integration> {
    const integration = await this.integrationModel
      .findById(id)
      .populate('project')
      .exec();

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  async update(
    id: string,
    updateIntegrationDto: UpdateIntegrationDto,
  ): Promise<Integration> {
    const updatedIntegration = await this.integrationModel
      .findByIdAndUpdate(id, updateIntegrationDto, { new: true })
      .populate('project')
      .exec();

    if (!updatedIntegration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return updatedIntegration;
  }

  async remove(id: string): Promise<void> {
    const result = await this.integrationModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }
  }

  async syncIntegration(id: string): Promise<Integration | null> {
    // In a real implementation, this would contain logic to sync with the external service
    // We don't need to store the integration constant since we're not using it
    await this.findOne(id); // Just verify it exists

    // Update the lastSyncedAt timestamp
    return this.integrationModel
      .findByIdAndUpdate(id, { lastSyncedAt: new Date() }, { new: true })
      .populate('project')
      .exec();
  }

  async toggleStatus(
    id: string,
    isEnabled: boolean,
  ): Promise<Integration | null> {
    // Just verify the integration exists
    await this.findOne(id);

    return this.integrationModel
      .findByIdAndUpdate(id, { isEnabled }, { new: true })
      .populate('project')
      .exec();
  }
}
