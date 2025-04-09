import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GlossaryTerm,
  GlossaryTermDocument,
} from './entities/glossary-term.entity';
import { CreateGlossaryTermDto } from './dto/create-glossary-term.dto';
import { UpdateGlossaryTermDto } from './dto/update-glossary-term.dto';
import { AddTranslationDto } from './dto/add-translation.dto';

@Injectable()
export class GlossaryTermsService {
  constructor(
    @InjectModel(GlossaryTerm.name)
    private glossaryTermModel: Model<GlossaryTermDocument>,
  ) {}

  async create(
    createGlossaryTermDto: CreateGlossaryTermDto,
  ): Promise<GlossaryTerm> {
    const newTerm = new this.glossaryTermModel(createGlossaryTermDto);
    return newTerm.save();
  }

  async findAll(query: any = {}): Promise<GlossaryTerm[]> {
    const {
      company,
      project,
      isGlobal,
      isActive,
      search,
      tags,
      page = 1,
      limit = 100,
    } = query;

    // Build filter
    const filter: any = {};

    if (company) {
      filter.company = company;
    }

    if (project) {
      filter.$or = [{ projects: project }, { isGlobal: true }];
    }

    if (isGlobal !== undefined) {
      filter.isGlobal = isGlobal === 'true';
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          {
            $or: [
              { term: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
            ],
          },
        ];
        delete filter.$or;
      } else {
        filter.$or = [
          { term: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $all: tagArray };
    }

    const skip = (page - 1) * limit;

    return this.glossaryTermModel
      .find(filter)
      .skip(skip)
      .limit(+limit)
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();
  }

  async findOne(id: string): Promise<GlossaryTerm> {
    const term = await this.glossaryTermModel
      .findById(id)
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();

    if (!term) {
      throw new NotFoundException(`Glossary term with ID ${id} not found`);
    }

    return term;
  }

  async update(
    id: string,
    updateGlossaryTermDto: UpdateGlossaryTermDto,
  ): Promise<GlossaryTerm> {
    const updatedTerm = await this.glossaryTermModel
      .findByIdAndUpdate(id, updateGlossaryTermDto, { new: true })
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();

    if (!updatedTerm) {
      throw new NotFoundException(`Glossary term with ID ${id} not found`);
    }

    return updatedTerm;
  }

  async remove(id: string): Promise<void> {
    const result = await this.glossaryTermModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Glossary term with ID ${id} not found`);
    }
  }

  async addTranslation(
    id: string,
    locale: string,
    addTranslationDto: AddTranslationDto,
  ): Promise<GlossaryTerm> {
    const term = await this.findOne(id);

    if (!term.translations) {
      term.translations = {};
    }

    term.translations[locale] = addTranslationDto.translation;

    return this.glossaryTermModel
      .findByIdAndUpdate(id, { translations: term.translations }, { new: true })
      .populate('company')
      .populate('projects')
      .populate('createdBy')
      .exec();
  }

  async removeTranslation(id: string, locale: string): Promise<GlossaryTerm> {
    const term = await this.findOne(id);

    if (term.translations && term.translations[locale]) {
      delete term.translations[locale];

      return this.glossaryTermModel
        .findByIdAndUpdate(
          id,
          { translations: term.translations },
          { new: true },
        )
        .populate('company')
        .populate('projects')
        .populate('createdBy')
        .exec();
    }

    return term;
  }

  async syncWithGoogle(
    companyId: string,
    locale: string,
  ): Promise<{ success: boolean; count: number }> {
    // In a real implementation, this would integrate with Google Translate's glossary API
    // For now, we'll just return a mock response
    return {
      success: true,
      count: 25, // Mock number of terms synced
    };
  }
}
