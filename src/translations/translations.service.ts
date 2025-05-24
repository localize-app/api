import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TranslationFactoryService } from './translation-factory.service';
import { TranslationProviderType } from './enums/translation-provider.enum';
import { Phrase, PhraseDocument } from '../phrases/entities/phrase.entity';
import { TranslationStatus } from '../phrases/entities/translation.entity';
import {
  BatchTranslationResultDto,
  TranslateBatchPhrasesDto,
} from './dto/translate-batch.dto';

@Injectable()
export class TranslationsService {
  private readonly logger = new Logger(TranslationsService.name);

  constructor(
    private translationFactory: TranslationFactoryService,
    @InjectModel(Phrase.name) private phraseModel: Model<PhraseDocument>,
  ) {}

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en-US',
    providerType?: TranslationProviderType,
  ): Promise<{ translatedText: string; provider: string }> {
    try {
      if (!text.trim()) {
        return { translatedText: '', provider: 'none' };
      }

      const provider = providerType
        ? this.translationFactory.getProvider(providerType)
        : await this.translationFactory.getBestProviderForLanguagePair(
            sourceLanguage,
            targetLanguage,
          );

      if (text.length > provider.getMaxTextLength()) {
        throw new BadRequestException(
          `Text too long for ${provider.getName()}. Maximum length: ${provider.getMaxTextLength()}`,
        );
      }

      const result = await provider.translateText({
        text,
        sourceLanguage,
        targetLanguage,
      });

      this.logger.log(
        `Translated text using ${result.provider}: "${text}" -> "${result.translatedText}"`,
      );

      return {
        translatedText: result.translatedText,
        provider: result.provider,
      };
    } catch (error) {
      this.logger.error(`Translation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async translateBatchPhrases(
    dto: TranslateBatchPhrasesDto,
  ): Promise<BatchTranslationResultDto> {
    const startTime = Date.now();
    this.logger.log(
      `Starting batch translation of ${dto.phraseIds.length} phrases`,
    );

    try {
      // Fetch all phrases
      const phrases = await this.phraseModel
        .find({ _id: { $in: dto.phraseIds } })
        .exec();

      if (phrases.length === 0) {
        throw new BadRequestException('No valid phrases found');
      }

      if (phrases.length !== dto.phraseIds.length) {
        this.logger.warn(
          `Found ${phrases.length} phrases but ${dto.phraseIds.length} IDs provided`,
        );
      }

      // Get the best available provider automatically
      const provider =
        await this.translationFactory.getBestProviderForLanguagePair(
          dto.sourceLanguage || 'en-US',
          dto.targetLanguage,
        );

      const results: BatchTranslationResultDto['results'] = [];
      let successCount = 0;
      let failureCount = 0;
      let skippedCount = 0;

      // Process each phrase
      for (const phrase of phrases) {
        try {
          // Check if translation already exists and we're not overwriting
          const existingTranslation = phrase.translations?.get(
            dto.targetLanguage,
          );
          if (existingTranslation && !dto.overwriteExisting) {
            results.push({
              phraseId: phrase._id.toString(),
              sourceText: phrase.sourceText,
              status: 'skipped',
              error: 'Translation already exists',
            });
            skippedCount++;
            continue;
          }

          // Check text length
          if (phrase.sourceText.length > provider.getMaxTextLength()) {
            results.push({
              phraseId: phrase._id.toString(),
              sourceText: phrase.sourceText,
              status: 'failed',
              error: `Text too long for ${provider.getName()} (max: ${provider.getMaxTextLength()})`,
            });
            failureCount++;
            continue;
          }

          // Translate the text
          const translationResult = await provider.translateText({
            text: phrase.sourceText,
            sourceLanguage: dto.sourceLanguage || 'en-US',
            targetLanguage: dto.targetLanguage,
          });

          // Save the translation to the phrase
          if (!phrase.translations) {
            phrase.translations = new Map();
          }

          phrase.translations.set(dto.targetLanguage, {
            text: translationResult.translatedText,
            status: dto.autoApprove
              ? TranslationStatus.APPROVED
              : TranslationStatus.PENDING,
            isHuman: false, // Machine translation
            lastModified: new Date(),
          });

          // Save the updated phrase
          await phrase.save();

          results.push({
            phraseId: phrase._id.toString(),
            sourceText: phrase.sourceText,
            translatedText: translationResult.translatedText,
            status: 'success',
          });
          successCount++;

          // Add small delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          this.logger.error(
            `Failed to translate phrase ${phrase._id}: ${error.message}`,
            error.stack,
          );

          results.push({
            phraseId: phrase._id.toString(),
            sourceText: phrase.sourceText,
            status: 'failed',
            error: error.message,
          });
          failureCount++;
        }
      }

      const processingTimeMs = Date.now() - startTime;

      this.logger.log(
        `Batch translation completed: ${successCount} success, ${failureCount} failed, ${skippedCount} skipped in ${processingTimeMs}ms`,
      );

      return {
        totalProcessed: phrases.length,
        successCount,
        failureCount,
        skippedCount,
        provider: provider.getName(),
        processingTimeMs,
        results,
      };
    } catch (error) {
      this.logger.error(
        `Batch translation failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  getAvailableProviders() {
    return this.translationFactory.getAvailableProviders();
  }
}
