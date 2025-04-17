/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Phrase, PhraseDocument } from './entities/phrase.entity';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { BatchOperationDto } from './dto/batch-operation.dto';
import { AddTranslationDto } from 'src/glossary-terms/dto/add-translation.dto';
import { Translation, TranslationStatus } from './entities/translation.entity';

@Injectable()
export class PhrasesService {
  constructor(
    @InjectModel(Phrase.name) private phraseModel: Model<PhraseDocument>,
  ) {}

  async create(createPhraseDto: CreatePhraseDto): Promise<Phrase> {
    const newPhrase = new this.phraseModel(createPhraseDto);
    return newPhrase.save();
  }

  async findAll(query: any = {}): Promise<Phrase[]> {
    const {
      project,
      status,
      isArchived,
      search,
      tags,
      page = 1,
      limit = 100,
    } = query;

    // Build filter
    const filter: any = {};

    if (project) {
      filter.project = project;
    }

    if (status) {
      filter.status = status;
    }

    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true';
    }

    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { sourceText: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $all: tagArray };
    }

    const skip = (page - 1) * limit;

    return this.phraseModel
      .find(filter)
      .skip(skip)
      .limit(+limit)
      .populate('project')
      .exec();
  }

  async findOne(id: string): Promise<Phrase> {
    const phrase = await this.phraseModel
      .findById(id)
      .populate('project')
      .exec();

    if (!phrase) {
      throw new NotFoundException(`Phrase with ID ${id} not found`);
    }

    return phrase;
  }

  async update(id: string, updatePhraseDto: UpdatePhraseDto): Promise<Phrase> {
    const updatedPhrase = await this.phraseModel
      .findByIdAndUpdate(id, updatePhraseDto, { new: true })
      .populate('project')
      .exec();

    if (!updatedPhrase) {
      throw new NotFoundException(`Phrase with ID ${id} not found`);
    }

    return updatedPhrase;
  }

  async remove(id: string): Promise<void> {
    const result = await this.phraseModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Phrase with ID ${id} not found`);
    }
  }

  async addTranslation(
    id: string,
    locale: string,
    translationDto: AddTranslationDto,
  ): Promise<Phrase | null> {
    const phrase = await this.findOne(id);

    // Create or update the translation for the specified locale
    // Initialize the translations Map if it doesn't exist
    if (!phrase.translations) {
      phrase.translations = new Map<string, Translation>();
    }

    // Create the translation object
    // @ts-ignore
    const translation: Translation = {
      text: translationDto.text,
      status: translationDto.status || TranslationStatus.PENDING,
      isHuman:
        translationDto.isHuman !== undefined ? translationDto.isHuman : true,
      lastModified: new Date(),
      modifiedBy: undefined, // This should be set to the current user ID
    };

    // Use set() method to add/update the translation in the Map
    phrase.translations.set(locale, translation);

    return this.phraseModel
      .findByIdAndUpdate(
        id,
        { translations: phrase.translations },
        { new: true },
      )
      .populate('project')
      .exec();
  }

  async updateStatus(id: string, statusDto: UpdateStatusDto): Promise<Phrase> {
    return this.update(id, { status: statusDto.status });
  }

  async processBatch(
    batchDto: BatchOperationDto,
  ): Promise<{ success: boolean; count: number }> {
    const ids = batchDto.items.map((item) => item.id);

    switch (batchDto.operation) {
      case 'publish':
        await this.phraseModel
          .updateMany({ _id: { $in: ids } }, { status: 'published' })
          .exec();
        break;

      case 'archive':
        await this.phraseModel
          .updateMany({ _id: { $in: ids } }, { isArchived: true })
          .exec();
        break;

      case 'delete':
        await this.phraseModel.deleteMany({ _id: { $in: ids } }).exec();
        break;

      case 'tag':
        if (batchDto.tag) {
          await this.phraseModel
            .updateMany(
              { _id: { $in: ids } },
              { $addToSet: { tags: batchDto.tag } },
            )
            .exec();
        }
        break;

      case 'untag':
        if (batchDto.tag) {
          await this.phraseModel
            .updateMany(
              { _id: { $in: ids } },
              { $pull: { tags: batchDto.tag } },
            )
            .exec();
        }
        break;
    }

    return { success: true, count: ids.length };
  }
}
