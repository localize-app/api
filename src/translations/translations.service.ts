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
import { CacheService } from '../cache/cache.service';
import { TranslationProvider } from './interfaces/translation-provider.interface';

@Injectable()
export class TranslationsService {
  private readonly logger = new Logger(TranslationsService.name);

  constructor(
    private translationFactory: TranslationFactoryService,
    private cacheService: CacheService, // Inject CacheService
    @InjectModel(Phrase.name) private phraseModel: Model<PhraseDocument>,
  ) {}

  getAvailableProviders() {
    return this.translationFactory.getAvailableProviders();
  }

  private async getActiveProvider(
    providerType?: TranslationProviderType,
  ): Promise<TranslationProvider> {
    if (providerType) {
      return this.translationFactory.getProvider(providerType);
    }

    // Get default provider if no specific type requested
    return this.translationFactory.getDefaultProvider();
  }

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

  // Add this method to your existing translations.service.ts

  async instantTranslate(
    dto: InstantTranslateDto,
    projectId: string,
  ): Promise<InstantTranslateResponseDto> {
    const startTime = Date.now();

    try {
      // Generate cache key based on texts, languages, and project
      const cacheKey = this.generateInstantCacheKey(
        dto.texts,
        dto.sourceLanguage || 'en',
        dto.targetLanguage,
        projectId,
        dto.context,
      );

      // Check cache first
      const cachedResult =
        await this.cacheService.get<InstantTranslateResponseDto>(cacheKey, {
          prefix: 'instant',
        });

      if (cachedResult) {
        this.logger.debug(`Cache hit for instant translation: ${cacheKey}`);
        // Update timestamp for cached result
        cachedResult.timestamp = new Date().toISOString();
        return cachedResult;
      }

      this.logger.debug(`Cache miss for instant translation: ${cacheKey}`);

      // Get translation provider
      const provider = await this.getActiveProvider();
      if (!provider) {
        throw new Error('No translation provider available');
      }

      // Process texts in batches if needed
      const translations: string[] = [];
      const batchSize = 10;

      for (let i = 0; i < dto.texts.length; i += batchSize) {
        const batch = dto.texts.slice(i, i + batchSize);
        const results = await provider.translateBatch({
          texts: batch,
          sourceLanguage: dto.sourceLanguage || 'en',
          targetLanguage: dto.targetLanguage,
        });
        translations.push(...results.translatedTexts);
      }

      const response: InstantTranslateResponseDto = {
        translations,
        sourceLanguage: dto.sourceLanguage || 'en',
        targetLanguage: dto.targetLanguage,
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      await this.cacheService.set(cacheKey, response, {
        prefix: 'instant',
        ttl: 3600, // Cache for 1 hour
      });

      // Track usage for analytics
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

  // Generate cache key for instant translations
  private generateInstantCacheKey(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    projectId: string,
    context?: string,
  ): string {
    // Create a hash of all texts to handle large arrays
    const textsHash = createHash('md5').update(texts.join('|||')).digest('hex');

    // Include context if provided for page-specific caching
    const contextPart = context ? `:${context.replace(/\//g, '-')}` : '';

    return `${projectId}:${sourceLang}:${targetLang}:${textsHash}${contextPart}`;
  }

  // Track usage for analytics/billing
  private async trackInstantTranslationUsage(
    projectId: string,
    textCount: number,
    provider: string,
  ): Promise<void> {
    try {
      // Increment counters in Redis for real-time analytics
      const today = new Date().toISOString().split('T')[0];
      const hourKey = new Date().toISOString().slice(0, 13);

      // Daily counter
      await this.cacheService.increment(
        `usage:instant:${projectId}:${today}`,
        textCount,
        { ttl: 86400 * 7 }, // Keep for 7 days
      );

      // Hourly counter
      await this.cacheService.increment(
        `usage:instant:${projectId}:${hourKey}`,
        textCount,
        { ttl: 86400 }, // Keep for 1 day
      );

      // Provider usage
      await this.cacheService.increment(
        `usage:provider:${provider}:${today}`,
        textCount,
        { ttl: 86400 * 30 }, // Keep for 30 days
      );

      this.logger.debug(
        `Tracked instant translation usage: ${textCount} texts for project ${projectId}`,
      );
    } catch (error) {
      this.logger.error('Failed to track usage:', error);
      // Don't throw - tracking failure shouldn't break translations
    }
  }

  // Get cache statistics for monitoring
  async getInstantTranslationStats(projectId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const hourKey = new Date().toISOString().slice(0, 13);

    try {
      const [dailyUsage, hourlyUsage] = await Promise.all([
        this.cacheService.get<number>(`usage:instant:${projectId}:${today}`),
        this.cacheService.get<number>(`usage:instant:${projectId}:${hourKey}`),
      ]);

      return {
        daily: dailyUsage || 0,
        hourly: hourlyUsage || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      return {
        daily: 0,
        hourly: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Clear instant translation cache for a project
  async clearInstantTranslationCache(projectId: string): Promise<void> {
    try {
      await this.cacheService.reset(`instant:${projectId}:*`);
      this.logger.log(
        `Cleared instant translation cache for project ${projectId}`,
      );
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw error;
    }
  }
}
