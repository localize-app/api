import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { TranslationFactoryService } from './translation-factory.service';
import { TranslationProviderType } from './enums/translation-provider.enum';

@Injectable()
export class TranslationsService {
  private readonly logger = new Logger(TranslationsService.name);

  constructor(private translationFactory: TranslationFactoryService) {}

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

      // Get the appropriate provider
      const provider = providerType
        ? this.translationFactory.getProvider(providerType)
        : await this.translationFactory.getBestProviderForLanguagePair(
            sourceLanguage,
            targetLanguage,
          );

      // Check text length limit
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

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'en-US',
    providerType?: TranslationProviderType,
  ): Promise<{ translatedTexts: string[]; provider: string }> {
    try {
      if (texts.length === 0) {
        return { translatedTexts: [], provider: 'none' };
      }

      // Get the appropriate provider
      const provider = providerType
        ? this.translationFactory.getProvider(providerType)
        : await this.translationFactory.getBestProviderForLanguagePair(
            sourceLanguage,
            targetLanguage,
          );

      // Check if any text exceeds length limit
      const maxLength = provider.getMaxTextLength();
      const longTexts = texts.filter((text) => text.length > maxLength);
      if (longTexts.length > 0) {
        throw new BadRequestException(
          `Some texts are too long for ${provider.getName()}. Maximum length: ${maxLength}`,
        );
      }

      const result = await provider.translateBatch({
        texts,
        sourceLanguage,
        targetLanguage,
      });

      this.logger.log(
        `Batch translated ${texts.length} texts using ${result.provider}`,
      );

      return {
        translatedTexts: result.translatedTexts,
        provider: result.provider,
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
