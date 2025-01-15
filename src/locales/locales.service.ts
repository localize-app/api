import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLocaleDto } from './dto/create-locale.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { Locale, LocaleDocument } from './entities/locale.entity';

@Injectable()
export class LocalesService {
  constructor(
    @InjectModel(Locale.name) private localeModel: Model<LocaleDocument>,
  ) {}

  // Create a new locale
  async create(createLocaleDto: CreateLocaleDto): Promise<Locale> {
    const newLocale = new this.localeModel(createLocaleDto);
    return newLocale.save();
  }

  // Get all locales
  async findAll(): Promise<Locale[]> {
    return this.localeModel
      .find()
      .populate('platforms') // Populate related platforms
      .exec();
  }

  // Get a specific locale by ID
  async findOne(id: string): Promise<Locale> {
    const locale = await this.localeModel
      .findById(id)
      .populate('platforms') // Populate related platforms
      .exec();
    if (!locale) {
      throw new NotFoundException(`Locale with ID ${id} not found`);
    }
    return locale;
  }

  // Update a locale
  async update(id: string, updateLocaleDto: UpdateLocaleDto): Promise<Locale> {
    const updatedLocale = await this.localeModel
      .findByIdAndUpdate(id, updateLocaleDto, { new: true })
      .populate('platforms') // Populate related platforms
      .exec();
    if (!updatedLocale) {
      throw new NotFoundException(`Locale with ID ${id} not found`);
    }
    return updatedLocale;
  }

  // Delete a locale
  async remove(id: string): Promise<void> {
    const result = await this.localeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Locale with ID ${id} not found`);
    }
  }
}
