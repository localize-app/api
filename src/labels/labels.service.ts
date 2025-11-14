import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Label, LabelDocument } from './entities/label.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name)
    private labelModel: Model<LabelDocument>,
  ) {}

  async create(createLabelDto: CreateLabelDto): Promise<Label> {
    const newLabel = new this.labelModel(createLabelDto);
    return newLabel.save();
  }

  async findAll(query: any = {}): Promise<Label[]> {
    const {
      company,
      project,
      category,
      isActive,
      search,
      page = 1,
      limit = 100,
    } = query;

    // Build filter
    const filter: any = {};

    if (company) {
      filter.company = company;
    }

    if (project) {
      filter.$or = [{ projects: project }, { projects: { $size: 0 } }];
    }

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    return this.labelModel
      .find(filter)
      .skip(skip)
      .limit(+limit)
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();
  }

  async findOne(id: string): Promise<Label> {
    const label = await this.labelModel
      .findById(id)
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();

    if (!label) {
      throw new NotFoundException(`Label with ID ${id} not found`);
    }

    return label;
  }

  async update(id: string, updateLabelDto: UpdateLabelDto): Promise<Label> {
    const updatedLabel = await this.labelModel
      .findByIdAndUpdate(id, updateLabelDto, { new: true })
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();

    if (!updatedLabel) {
      throw new NotFoundException(`Label with ID ${id} not found`);
    }

    return updatedLabel;
  }

  async remove(id: string): Promise<void> {
    const result = await this.labelModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Label with ID ${id} not found`);
    }
  }

  async incrementUsage(labelId: string): Promise<Label | null> {
    return this.labelModel
      .findByIdAndUpdate(labelId, { $inc: { usageCount: 1 } }, { new: true })
      .exec();
  }

  async decrementUsage(labelId: string): Promise<Label | null> {
    return this.labelModel
      .findByIdAndUpdate(labelId, { $inc: { usageCount: -1 } }, { new: true })
      .exec();
  }
}
