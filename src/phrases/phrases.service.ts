import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'fast-csv';
import * as xlsx from 'xlsx';

import {
  Phrase,
  PhraseDocument,
  PhraseLocation,
} from './entities/phrase.entity';
import { Project, ProjectDocument } from '../projects/entities/project.entity';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { PhraseStatus, UpdateStatusDto } from './dto/update-status.dto';
import { BatchOperationDto } from './dto/batch-operation.dto';
import { AddTranslationDto } from './dto/add-translation.dto';
import { Translation, TranslationStatus } from './entities/translation.entity';
import { ExtractPhrasesDto } from './dto/extract-phrases.dto';

@Injectable()
export class PhrasesService {
  private readonly logger = new Logger(PhrasesService.name);

  constructor(
    @InjectModel(Phrase.name) private phraseModel: Model<PhraseDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  /**
   * Create a new phrase
   */
  async create(createPhraseDto: CreatePhraseDto): Promise<Phrase> {
    try {
      // Verify project exists
      const project = await this.projectModel
        .findById(createPhraseDto.project)
        .exec();
      if (!project) {
        throw new NotFoundException(
          `Project with ID ${createPhraseDto.project} not found`,
        );
      }

      // Check if phrase with the same key already exists in this project
      const existingPhrase = await this.phraseModel
        .findOne({
          project: createPhraseDto.project,
          key: createPhraseDto.key,
        })
        .exec();

      if (existingPhrase) {
        throw new BadRequestException(
          `A phrase with key '${createPhraseDto.key}' already exists in this project`,
        );
      }

      // Create new phrase
      const newPhrase = new this.phraseModel(createPhraseDto);
      return newPhrase.save();
    } catch (error) {
      this.logger.error(
        `Failed to create phrase: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all phrases with optional filtering
   */
  async findAll(
    query: any = {},
  ): Promise<{ phrases: Phrase[]; total: number }> {
    const {
      project,
      translationStatus, // NEW: Filter by translation status
      locale, // NEW: Filter by specific locale
      isArchived,
      search,
      tags,
      page = 1,
      limit = 20,
    } = query;

    // Build filter
    const filter: any = {};

    if (project) {
      filter.project = project;
    }

    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true' || isArchived === true;
    }

    if (search) {
      filter.$or = [
        { key: { $regex: search, $options: 'i' } },
        { sourceText: { $regex: search, $options: 'i' } },
        { context: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $all: tagArray };
    }

    // NEW: Filter by translation status for a specific locale
    if (translationStatus && locale) {
      filter[`translations.${locale}.status`] = translationStatus;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get total count
    const total = await this.phraseModel.countDocuments(filter).exec();

    // Get paginated results
    const phrases = await this.phraseModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string))
      .populate('project')
      .exec();

    return { phrases, total };
  }

  /**
   * Find a phrase by ID
   */
  async findOne(id: string): Promise<Phrase> {
    try {
      const phrase = await this.phraseModel
        .findById(id)
        .populate('project')
        .exec();

      if (!phrase) {
        throw new NotFoundException(`Phrase with ID ${id} not found`);
      }

      return phrase;
    } catch (error) {
      this.logger.error(
        `Failed to find phrase ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a phrase
   */
  async update(id: string, updatePhraseDto: UpdatePhraseDto): Promise<Phrase> {
    try {
      // Check if changing key and if the new key already exists
      if (updatePhraseDto.key) {
        const phrase = await this.phraseModel.findById(id).exec();

        if (!phrase) {
          throw new NotFoundException(`Phrase with ID ${id} not found`);
        }

        if (phrase.key !== updatePhraseDto.key) {
          const existingPhrase = await this.phraseModel
            .findOne({
              project: updatePhraseDto.project || phrase.project,
              key: updatePhraseDto.key,
              _id: { $ne: id },
            })
            .exec();

          if (existingPhrase) {
            throw new BadRequestException(
              `A phrase with key '${updatePhraseDto.key}' already exists in this project`,
            );
          }
        }
      }

      const updatedPhrase = await this.phraseModel
        .findByIdAndUpdate(id, updatePhraseDto, { new: true })
        .populate('project')
        .exec();

      if (!updatedPhrase) {
        throw new NotFoundException(`Phrase with ID ${id} not found`);
      }

      return updatedPhrase;
    } catch (error) {
      this.logger.error(
        `Failed to update phrase ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Remove a phrase
   */
  async remove(id: string): Promise<void> {
    try {
      const result = await this.phraseModel.findByIdAndDelete(id).exec();

      if (!result) {
        throw new NotFoundException(`Phrase with ID ${id} not found`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete phrase ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Add or update a translation for a phrase
   */
  async addTranslation(
    id: string,
    locale: string,
    translationDto: AddTranslationDto,
  ): Promise<Phrase | null> {
    try {
      const phrase = await this.findOne(id);

      // Create a valid translation object
      const translation: Translation = {
        text: translationDto.text,
        status: translationDto.status || TranslationStatus.PENDING,
        isHuman:
          translationDto.isHuman !== undefined ? translationDto.isHuman : true,
        lastModified: new Date(),
        // Cast to any to satisfy TypeScript - in a real implementation, you'd query the User model
        modifiedBy: translationDto.modifiedBy as any,
      };

      // Initialize translations map if it doesn't exist
      if (!phrase.translations) {
        phrase.translations = new Map();
      }

      // Use set() method to add/update the translation for the locale
      phrase.translations.set(locale, translation);

      return this.phraseModel
        .findByIdAndUpdate(
          id,
          { translations: phrase.translations },
          { new: true },
        )
        .populate('project')
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to add translation for phrase ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update phrase status
   */
  async updateStatus(id: string, statusDto: UpdateStatusDto): Promise<Phrase> {
    try {
      const updatedPhrase = await this.phraseModel
        .findByIdAndUpdate(id, { status: statusDto.status }, { new: true })
        .populate('project')
        .exec();

      if (!updatedPhrase) {
        throw new NotFoundException(`Phrase with ID ${id} not found`);
      }

      return updatedPhrase;
    } catch (error) {
      this.logger.error(
        `Failed to update status for phrase ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Publish a single phrase
   */
  async publishPhrase(id: string): Promise<Phrase> {
    try {
      const phrase = await this.findOne(id);

      // Validate that phrase has at least one translation
      if (!phrase.translations || phrase.translations.size === 0) {
        throw new BadRequestException(
          'Cannot publish phrase without any translations',
        );
      }

      const updatedPhrase = await this.phraseModel
        .findByIdAndUpdate(
          id,
          {
            status: PhraseStatus.PUBLISHED,
            updatedAt: new Date(),
          },
          { new: true },
        )
        .populate('project')
        .exec();

      if (!updatedPhrase) {
        throw new NotFoundException(`Phrase with ID ${id} not found`);
      }

      this.logger.log(`Successfully published phrase ${id}`);
      return updatedPhrase;
    } catch (error) {
      this.logger.error(
        `Failed to publish phrase ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Process batch operations on phrases
   */
  // Updated batch operation to work with translation status
  // Updated batch operation to work with translation status
  async processBatch(
    batchDto: BatchOperationDto,
  ): Promise<{ success: boolean; count: number }> {
    try {
      const ids = batchDto.items.map((item) => item.id);

      switch (batchDto.operation) {
        case 'approve_translations':
          // NEW: Approve all translations for specific locale
          if ((batchDto as any).locale) {
            const locale = (batchDto as any).locale;
            const phrases = await this.phraseModel
              .find({ _id: { $in: ids } })
              .exec();

            for (const phrase of phrases) {
              if (phrase.translations && phrase.translations.has(locale)) {
                const translation = phrase.translations.get(locale);
                if (translation) {
                  translation.status = TranslationStatus.APPROVED;
                  translation.reviewedAt = new Date();
                  phrase.translations.set(locale, translation);
                  await phrase.save();
                }
              }
            }
          }
          break;

        case 'reject_translations':
          // NEW: Reject all translations for specific locale
          if ((batchDto as any).locale) {
            const locale = (batchDto as any).locale;
            const phrases = await this.phraseModel
              .find({ _id: { $in: ids } })
              .exec();

            for (const phrase of phrases) {
              if (phrase.translations && phrase.translations.has(locale)) {
                const translation = phrase.translations.get(locale);
                if (translation) {
                  translation.status = TranslationStatus.REJECTED;
                  translation.reviewedAt = new Date();
                  phrase.translations.set(locale, translation);
                  await phrase.save();
                }
              }
            }
          }
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

        default:
          throw new BadRequestException(
            `Unsupported batch operation: ${batchDto.operation}`,
          );
      }

      return { success: true, count: ids.length };
    } catch (error) {
      this.logger.error(
        `Failed to process batch operation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  /**
   * Publish multiple phrases by IDs
   */
  async publishMultiple(phraseIds: string[]): Promise<{
    success: boolean;
    published: number;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];
      let published = 0;

      for (const phraseId of phraseIds) {
        try {
          await this.publishPhrase(phraseId);
          published++;
        } catch (error) {
          errors.push(`${phraseId}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        published,
        errors,
      };
    } catch (error) {
      this.logger.error(
        `Failed to publish multiple phrases: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Export phrases to a file
   */
  async exportPhrases(
    projectId: string,
    format: 'json' | 'csv' | 'xlsx' = 'json',
    options?: { locales?: string[]; status?: string[] },
  ): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    // Implementation remains the same as in your original code
    try {
      // Verify project exists
      const project = await this.projectModel.findById(projectId).exec();
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Build filter
      const filter: any = {
        project: projectId,
      };

      // Add status filter if provided
      if (options?.status && options.status.length > 0) {
        filter.status = { $in: options.status };
      }

      // Get phrases
      const phrases = await this.phraseModel
        .find(filter)
        .populate('project')
        .exec();

      // Transform data for export
      const exportData = phrases.map((phrase) => {
        const phraseObj = phrase.toObject();
        const exportItem: any = {
          id: phraseObj._id.toString(),
          key: phraseObj.key,
          sourceText: phraseObj.sourceText,
          context: phraseObj.context || '',
          isArchived: phraseObj.isArchived,
          tags: phraseObj.tags || [],
        };

        // Add translations if requested
        if (options?.locales && options.locales.length > 0) {
          const translations: Record<string, any> = {};

          // Filter translations by requested locales
          for (const locale of options.locales) {
            const translation = phraseObj.translations
              ? phraseObj.translations.get(locale)
              : undefined;

            if (translation) {
              translations[locale] = {
                text: translation.text,
                status: translation.status,
                isHuman: translation.isHuman,
              };
            }
          }

          exportItem.translations = translations;
        } else {
          // Include all translations
          exportItem.translations = phraseObj.translations || {};
        }

        return exportItem;
      });

      // Generate file content based on format
      let data: Buffer;
      let mimeType: string;
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.-]/g, '')
        .substring(0, 14);
      const projectName = project.name
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      let filename = `phrases_${projectName}_${timestamp}`;

      switch (format) {
        case 'json':
          data = Buffer.from(JSON.stringify(exportData, null, 2), 'utf8');
          mimeType = 'application/json';
          filename += '.json';
          break;

        case 'csv':
        case 'csv':
          // Convert to CSV format
          const csvData: any[] = [];

          // Get all used locale codes
          const locales = new Set<string>();
          exportData.forEach((phrase) => {
            Object.keys(phrase.translations || {}).forEach((locale) =>
              locales.add(locale),
            );
          });

          // Create headers
          const headers = [
            'id',
            'key',
            'sourceText',
            'context',
            'status',
            'isArchived',
            'tags',
          ];

          // Add translation headers for each locale
          const localeHeaders: string[] = [];
          locales.forEach((locale) => {
            localeHeaders.push(
              `${locale}_text`,
              `${locale}_status`,
              `${locale}_isHuman`,
            );
          });

          // Combine all headers
          const allHeaders = [...headers, ...localeHeaders];
          csvData.push(allHeaders);

          // Add data rows
          exportData.forEach((phrase) => {
            const row: any[] = [
              phrase.id,
              phrase.key,
              phrase.sourceText,
              phrase.context,
              phrase.status,
              phrase.isArchived,
              phrase.tags.join(','),
            ];

            // Add translation data for each locale
            locales.forEach((locale) => {
              const translation = phrase.translations?.[locale];
              if (translation) {
                row.push(
                  translation.text,
                  translation.status,
                  translation.isHuman,
                );
              } else {
                row.push('', '', '');
              }
            });

            csvData.push(row);
          });

          // Generate CSV
          const csvString = await new Promise<string>((resolve, reject) => {
            let result = '';
            const csvStream = csv.format({ headers: true, quoteColumns: true });

            csvStream.on('data', (chunk) => {
              result += chunk.toString();
            });

            csvStream.on('end', () => {
              resolve(result);
            });

            csvStream.on('error', (error) => {
              reject(error);
            });

            csvData.forEach((row) => {
              csvStream.write(row);
            });

            csvStream.end();
          });

          data = Buffer.from(csvString, 'utf8');
          mimeType = 'text/csv';
          filename += '.csv';
          break;

        case 'xlsx':
          // Convert to XLSX format
          const workbook = xlsx.utils.book_new();

          // Convert data to worksheet format
          const worksheetData: any[] = [];

          // Headers
          const xlsxHeaders = [
            'ID',
            'Key',
            'Source Text',
            'Context',
            'Status',
            'Archived',
            'Tags',
          ];

          // Get all used locale codes
          const xlsxLocales = new Set<string>();
          exportData.forEach((phrase) => {
            Object.keys(phrase.translations || {}).forEach((locale) =>
              xlsxLocales.add(locale),
            );
          });

          // Add translation headers for each locale
          xlsxLocales.forEach((locale) => {
            xlsxHeaders.push(
              `${locale} - Text`,
              `${locale} - Status`,
              `${locale} - Human`,
            );
          });

          worksheetData.push(xlsxHeaders);

          // Add data rows
          exportData.forEach((phrase) => {
            const row: any[] = [
              phrase.id,
              phrase.key,
              phrase.sourceText,
              phrase.context,
              phrase.status,
              phrase.isArchived ? 'Yes' : 'No',
              phrase.tags.join(', '),
            ];

            // Add translation data for each locale
            xlsxLocales.forEach((locale) => {
              const translation = phrase.translations?.[locale];
              if (translation) {
                row.push(
                  translation.text,
                  translation.status,
                  translation.isHuman ? 'Yes' : 'No',
                );
              } else {
                row.push('', '', '');
              }
            });

            worksheetData.push(row);
          });

          // Create worksheet and add to workbook
          const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);
          xlsx.utils.book_append_sheet(workbook, worksheet, 'Phrases');

          // Generate XLSX file
          const xlsxData = xlsx.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
          });

          data = xlsxData;
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename += '.xlsx';
          break;

        default:
          throw new BadRequestException(`Unsupported export format: ${format}`);
      }

      return { data, filename, mimeType };
    } catch (error) {
      this.logger.error(
        `Failed to export phrases: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Import phrases from a file
   */
  async importPhrases(
    projectId: string,
    filePath: string,
    options?: { overwrite?: boolean },
  ): Promise<{
    success: boolean;
    imported: number;
    updated: number;
    errors: number;
  }> {
    try {
      // Verify project exists
      const project = await this.projectModel.findById(projectId).exec();
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Read the file
      let fileContent: any;
      const fileExt = path.extname(filePath).toLowerCase();

      switch (fileExt) {
        case '.json':
          // Read JSON file
          const jsonContent = fs.readFileSync(filePath, 'utf8');
          fileContent = JSON.parse(jsonContent);
          break;

        case '.csv':
          // Read CSV file
          fileContent = await this.readCsvFile(filePath);
          break;

        case '.xlsx':
          // Read XLSX file
          fileContent = this.readXlsxFile(filePath);
          break;

        default:
          throw new BadRequestException(`Unsupported file format: ${fileExt}`);
      }

      // Process imported data
      const result = {
        success: true,
        imported: 0,
        updated: 0,
        errors: 0,
      };

      // Process each row
      for (const item of fileContent) {
        try {
          // Basic validation
          if (!item.key || !item.sourceText) {
            result.errors++;
            continue;
          }

          // Check if phrase exists
          const existingPhrase = await this.phraseModel
            .findOne({
              project: projectId,
              key: item.key,
            })
            .exec();

          if (existingPhrase) {
            // Update existing phrase if overwrite is enabled
            if (options?.overwrite) {
              const updateData: any = {
                sourceText: item.sourceText,
                context: item.context,
              };

              // Update status if provided
              if (item.status) {
                updateData.status = item.status;
              }

              // Update isArchived if provided
              if (item.isArchived !== undefined) {
                updateData.isArchived = item.isArchived;
              }

              // Update tags if provided
              if (item.tags) {
                updateData.tags = Array.isArray(item.tags)
                  ? item.tags
                  : item.tags.split(',').map((tag: string) => tag.trim());
              }

              // Update translations if provided
              if (item.translations) {
                // Get existing translations
                const translations = existingPhrase.translations || new Map();

                // Process each translation
                Object.entries(item.translations).forEach(
                  ([locale, translation]: [string, any]) => {
                    // Only add valid translations
                    if (translation && translation.text) {
                      translations.set(locale, {
                        text: translation.text,
                        status: translation.status || TranslationStatus.PENDING,
                        isHuman:
                          translation.isHuman !== undefined
                            ? translation.isHuman
                            : true,
                        lastModified: new Date(),
                      });
                    }
                  },
                );

                updateData.translations = translations;
              }

              await this.phraseModel
                .findByIdAndUpdate(existingPhrase._id, updateData)
                .exec();

              result.updated++;
            } else {
              // Skip if overwrite is disabled
              continue;
            }
          } else {
            // Create new phrase
            const newPhrase: any = {
              key: item.key,
              sourceText: item.sourceText,
              context: item.context || '',
              project: projectId,
              status: item.status || 'pending',
              isArchived: item.isArchived || false,
            };

            // Add tags if provided
            if (item.tags) {
              newPhrase.tags = Array.isArray(item.tags)
                ? item.tags
                : item.tags.split(',').map((tag: string) => tag.trim());
            }

            // Add translations if provided
            if (item.translations) {
              const translations = new Map();

              // Process each translation
              Object.entries(item.translations).forEach(
                ([locale, translation]: [string, any]) => {
                  // Only add valid translations
                  if (translation && translation.text) {
                    translations.set(locale, {
                      text: translation.text,
                      status: translation.status || TranslationStatus.PENDING,
                      isHuman:
                        translation.isHuman !== undefined
                          ? translation.isHuman
                          : true,
                      lastModified: new Date(),
                    });
                  }
                },
              );

              newPhrase.translations = translations;
            }

            await this.phraseModel.create(newPhrase);
            result.imported++;
          }
        } catch (error) {
          this.logger.error(
            `Error processing import item: ${error.message}`,
            error.stack,
          );
          result.errors++;
        }
      }

      // Clean up temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        this.logger.warn(
          `Failed to delete temporary file ${filePath}: ${error.message}`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to import phrases: ${error.message}`,
        error.stack,
      );

      // Clean up temporary file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        // Ignore cleanup errors
      }

      throw error;
    }
  }

  /**
   * Helper method to read a CSV file
   */
  private async readCsvFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true }))
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => {
          // Process the data to convert it to the proper format
          const processedData = results.map((row) => {
            const processedRow: any = {
              key: row.key,
              sourceText: row.sourceText,
              context: row.context || '',
              status: row.status || 'pending',
              isArchived: row.isArchived === 'true' || row.isArchived === 'Yes',
              tags: row.tags
                ? row.tags.split(',').map((tag: string) => tag.trim())
                : [],
              translations: {},
            };

            // Process translations
            Object.keys(row).forEach((key) => {
              // Check for translation fields in format locale_text, locale_status, locale_isHuman
              const match = key.match(/^([a-z]{2}-[A-Z]{2})_(.+)$/);
              if (match) {
                const [, locale, field] = match;

                // Initialize locale entry if it doesn't exist
                if (!processedRow.translations[locale]) {
                  processedRow.translations[locale] = {};
                }

                // Set the field value
                if (field === 'text') {
                  processedRow.translations[locale].text = row[key];
                } else if (field === 'status') {
                  processedRow.translations[locale].status =
                    row[key] || 'pending';
                } else if (field === 'isHuman') {
                  processedRow.translations[locale].isHuman =
                    row[key] === 'true' || row[key] === 'Yes';
                }
              }
            });

            return processedRow;
          });

          resolve(processedData);
        });
    });
  }

  /**
   * Helper method to read an XLSX file
   */
  private readXlsxFile(filePath: string): any[] {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Process the data
    return data.map((row: any) => {
      const processedRow: any = {
        key: row.Key,
        sourceText: row['Source Text'],
        context: row.Context || '',
        status: row.Status || 'pending',
        isArchived: row.Archived === 'Yes' || row.Archived === true,
        tags: row.Tags
          ? row.Tags.split(',').map((tag: string) => tag.trim())
          : [],
        translations: {},
      };

      // Process translations
      Object.keys(row).forEach((key) => {
        // Check for translation fields in format "locale - Field"
        const match = key.match(/^([a-z]{2}-[A-Z]{2}) - (.+)$/);
        if (match) {
          const [, locale, field] = match;

          // Initialize locale entry if it doesn't exist
          if (!processedRow.translations[locale]) {
            processedRow.translations[locale] = {};
          }

          // Set the field value
          if (field === 'Text') {
            processedRow.translations[locale].text = row[key];
          } else if (field === 'Status') {
            processedRow.translations[locale].status = row[key] || 'pending';
          } else if (field === 'Human') {
            processedRow.translations[locale].isHuman =
              row[key] === 'Yes' || row[key] === true;
          }
        }
      });

      return processedRow;
    });
  }

  // NEW: Method to get phrases that need attention (have pending/rejected translations)
  async getPhrasesThatNeedAttention(
    projectId: string,
    locale?: string,
  ): Promise<Phrase[]> {
    const filter: any = {
      project: projectId,
      isArchived: false,
    };

    if (locale) {
      // Find phrases where the specific locale has pending or rejected status
      filter.$or = [
        { [`translations.${locale}.status`]: 'pending' },
        { [`translations.${locale}.status`]: 'rejected' },
        { [`translations.${locale}.status`]: 'needs_review' },
      ];
    } else {
      // For MongoDB, we need to use aggregation to check nested map values
      // This is a simplified approach - in practice you might want to use aggregation pipeline
      const phrases = await this.phraseModel
        .find({ project: projectId, isArchived: false })
        .populate('project')
        .exec();

      // Filter in JavaScript since MongoDB Map queries are complex
      return phrases.filter((phrase) => {
        if (!phrase.translations) return false;

        const translations = Array.from(phrase.translations.values());
        return translations.some(
          (translation) =>
            translation.status === 'pending' ||
            translation.status === 'rejected' ||
            translation.status === 'needs_review',
        );
      });
    }

    return this.phraseModel
      .find(filter)
      .populate('project')
      .sort({ updatedAt: -1 })
      .exec();
  }

  // NEW: Method to get completion status for a project
  async getProjectCompletionStatus(projectId: string): Promise<{
    totalPhrases: number;
    translationStats: Record<
      string,
      {
        total: number;
        approved: number;
        pending: number;
        rejected: number;
        needsReview: number;
        completionPercentage: number;
      }
    >;
  }> {
    const phrases = await this.phraseModel
      .find({ project: projectId, isArchived: false })
      .exec();

    const totalPhrases = phrases.length;
    const translationStats: Record<string, any> = {};

    // Collect all locales
    const allLocales = new Set<string>();
    phrases.forEach((phrase) => {
      if (phrase.translations) {
        Array.from(phrase.translations.keys()).forEach((locale) => {
          allLocales.add(locale);
        });
      }
    });

    // Calculate stats for each locale
    allLocales.forEach((locale) => {
      const stats = {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        needsReview: 0,
        completionPercentage: 0,
      };

      phrases.forEach((phrase) => {
        const translation = phrase.translations?.get(locale);
        if (translation) {
          stats.total++;
          switch (translation.status) {
            case 'approved':
              stats.approved++;
              break;
            case 'pending':
              stats.pending++;
              break;
            case 'rejected':
              stats.rejected++;
              break;
            case 'needs_review':
              stats.needsReview++;
              break;
          }
        }
      });

      stats.completionPercentage =
        stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

      translationStats[locale] = stats;
    });

    return {
      totalPhrases,
      translationStats,
    };
  }

  // NEW: Method to update translation status
  async updateTranslationStatus(
    phraseId: string,
    locale: string,
    statusData: { status: TranslationStatus; reviewComments?: string },
  ): Promise<Phrase> {
    try {
      const phrase = await this.findOne(phraseId);

      if (!phrase.translations || !phrase.translations.has(locale)) {
        throw new NotFoundException(
          `Translation for locale '${locale}' not found in phrase ${phraseId}`,
        );
      }

      const translation = phrase.translations.get(locale);
      if (!translation) {
        throw new NotFoundException(
          `Translation for locale '${locale}' not found`,
        );
      }

      // Update the translation
      translation.status = statusData.status;
      translation.reviewedAt = new Date();
      if (statusData.reviewComments) {
        translation.reviewComments = statusData.reviewComments;
      }
      translation.lastModified = new Date();

      // Save back to the phrase
      phrase.translations.set(locale, translation);

      const updatedPhrase = await this.phraseModel
        .findByIdAndUpdate(
          phraseId,
          { translations: phrase.translations },
          { new: true },
        )
        .populate('project')
        .exec();

      if (!updatedPhrase) {
        throw new NotFoundException(`Phrase with ID ${phraseId} not found`);
      }

      return updatedPhrase;
    } catch (error) {
      this.logger.error(
        `Failed to update translation status for phrase ${phraseId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Helper to generate a phrase key from textAdd commentMore actions
  private generatePhraseKey(text: string): string {
    // Create a kebab-case key, limit length
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 40);
  }

  // Utility functions for updating phrases with occurrence dataAdd commentMore actions
  private updatePhraseOccurrences(
    phrase: PhraseDocument,
    count: number = 1,
  ): void {
    if (!phrase.occurrences) {
      phrase.occurrences = {
        count: count,
        firstSeen: new Date(),
        lastSeen: new Date(),
        locations: [],
      };
    } else {
      phrase.occurrences.count += count;
      phrase.occurrences.lastSeen = new Date();
    }
    phrase.lastSeenAt = new Date(); // Keep the existing field updated for compatibility
  }

  private addPhraseLocation(
    phrase: PhraseDocument,
    location: PhraseLocation,
  ): void {
    if (!phrase.occurrences) {
      phrase.occurrences = {
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        locations: [],
      };
    }

    phrase.occurrences.locations.push(location);
    phrase.occurrences.lastSeen = new Date();
    phrase.lastSeenAt = new Date(); // Keep the existing field updated for compatibility
  }

  async batchExtract(extractDto: ExtractPhrasesDto) {
    try {
      // Find project by key
      const project = await this.projectModel.findOne({
        projectKey: extractDto.projectKey,
      });
      if (!project) {
        throw new NotFoundException(
          `Project with key ${extractDto.projectKey} not found`,
        );
      }

      // Process each phrase
      const results = await Promise.all(
        extractDto.phrases.map(async (phraseDto) => {
          // Check if phrase already exists
          let phrase = await this.phraseModel.findOne({
            project: project._id,
            sourceText: phraseDto.sourceText,
          });

          if (!phrase) {
            // Create new phrase
            phrase = new this.phraseModel({
              key: this.generatePhraseKey(phraseDto.sourceText),
              sourceText: phraseDto.sourceText,
              context: phraseDto.context,
              project: project._id,
              status: 'pending',
              sourceUrl: extractDto.sourceUrl,
              sourceType: extractDto.sourceType,
              lastSeenAt: new Date(),
              // Initialize occurrence data
              occurrences: {
                count: phraseDto.count || 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                locations:
                  phraseDto.locations?.map((loc) => ({
                    ...loc,
                    timestamp: new Date(),
                  })) || [],
              },
            });
            await phrase.save();
            return { created: true, id: phrase._id };
          } else {
            // Update existing phrase
            phrase.lastSeenAt = new Date();

            // Update source URL if not set
            if (!phrase.sourceUrl) {
              phrase.sourceUrl = extractDto.sourceUrl;
            }

            // Update source type if not set
            if (!phrase.sourceType && extractDto.sourceType) {
              phrase.sourceType = extractDto.sourceType;
            }

            // Update occurrences
            if (phraseDto.count) {
              this.updatePhraseOccurrences(phrase, phraseDto.count);
            }

            // Add locations if provided
            if (phraseDto.locations && phraseDto.locations.length > 0) {
              for (const location of phraseDto.locations) {
                this.addPhraseLocation(phrase, {
                  ...location,
                  timestamp: new Date(),
                });
              }
            }

            await phrase.save();
            return { created: false, id: phrase._id, updated: true };
          }
        }),
      );

      return {
        success: true,
        processed: results.length,
        created: results.filter((r) => r.created).length,
        updated: results.filter((r) => !r.created).length,
      };
    } catch (error) {
      console.log('Error processing extracted phrases:', error);
    }
  }
}
