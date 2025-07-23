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
import {
  InstantTranslateDto,
  InstantTranslateResponseDto,
} from './dto/instant-translate.dto';
import { createHash } from 'crypto';

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

  // Add this method to your existing translations.service.ts

  async instantTranslate(
    dto: InstantTranslateDto,
    projectId: string,
  ): Promise<InstantTranslateResponseDto> {
    const startTime = Date.now();

    this.logger.log(
      `Instant translation request: ${dto.texts.length} texts from ${dto.sourceLanguage} to ${dto.targetLanguage}`,
    );

    try {
      // Check cache first (optional - implement Redis caching)
      const cacheKey = this.generateCacheKey(
        dto.texts,
        dto.sourceLanguage,
        dto.targetLanguage,
      );
      const cached = await this.getCachedTranslations(cacheKey);
      if (cached) {
        this.logger.log('Returning cached translations');
        return cached;
      }

      // Get the best available provider
      const provider =
        await this.translationFactory.getBestProviderForLanguagePair(
          dto.sourceLanguage || 'en',
          dto.targetLanguage,
        );

      // Check if provider supports batch translation
      const translations: string[] = [];

      if (provider.translateBatch) {
        // Use batch translation if available
        const batchResult = await provider.translateBatch({
          texts: dto.texts,
          sourceLanguage: dto.sourceLanguage || 'en',
          targetLanguage: dto.targetLanguage,
        });
        translations.push(...batchResult.translatedTexts);
      } else {
        // Fallback to individual translations
        const translationPromises = dto.texts.map((text: any) =>
          provider.translateText({
            text,
            sourceLanguage: dto.sourceLanguage || 'en',
            targetLanguage: dto.targetLanguage,
          }),
        );

        const results = await Promise.all(translationPromises);
        translations.push(...results.map((r: any) => r.translatedText));
      }

      const response: InstantTranslateResponseDto = {
        translations,
        sourceLanguage: dto.sourceLanguage || 'en',
        targetLanguage: dto.targetLanguage,
        timestamp: new Date().toISOString(),
      };

      // Cache the result (optional)
      await this.cacheTranslations(cacheKey, response);

      // Track usage (optional)
      await this.trackInstantTranslationUsage(
        projectId,
        dto.texts.length,
        provider.getName(),
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `Instant translation completed in ${duration}ms using ${provider.getName()}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Instant translation failed: ${error.message}`,
        error.stack,
      );

      // Return original texts on error
      return {
        translations: dto.texts,
        sourceLanguage: dto.sourceLanguage || 'en',
        targetLanguage: dto.targetLanguage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Helper methods to add to the service
  private generateCacheKey(
    texts: string[],
    sourceLang: string,
    targetLang: string,
  ): string {
    const textHash = createHash('md5').update(texts.join('|')).digest('hex');
    return `instant:${sourceLang}:${targetLang}:${textHash}`;
  }

  private async getCachedTranslations(
    key: string,
  ): Promise<InstantTranslateResponseDto | null> {
    console.log(`Checking cache for key: ${key}`);

    // Implement Redis caching here if available
    // Example:
    // const cached = await this.redis.get(key);
    // return cached ? JSON.parse(cached) : null;
    return null;
  }

  private async cacheTranslations(
    key: string,
    data: InstantTranslateResponseDto,
  ): Promise<void> {
    console.log(`Caching translations for key: ${key}`, data);
    // Implement Redis caching here if available
    // Example:
    // await this.redis.setex(key, 3600, JSON.stringify(data)); // Cache for 1 hour
  }

  private async trackInstantTranslationUsage(
    projectId: string,
    textCount: number,
    provider: string,
  ): Promise<void> {
    console.log(
      `Tracking instant translation usage for project ${projectId}: ${textCount} texts using ${provider}`,
    );

    // Optional: Track usage for analytics/billing
    // You could create an activity record or update project statistics
  }
}
