// src/translations/providers/mymemory.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  TranslationProvider,
  TranslationRequest,
  BatchTranslationRequest,
  TranslationResponse,
  BatchTranslationResponse,
} from '../interfaces/translation-provider.interface';

@Injectable()
export class MyMemoryProvider implements TranslationProvider {
  private readonly logger = new Logger(MyMemoryProvider.name);
  private readonly baseUrl = 'https://api.mymemory.translated.net';
  private readonly dailyLimit = 10000; // MyMemory free daily limit

  constructor() {
    this.logger.log('MyMemoryProvider instantiated');
    this.logger.log(`Base URL: ${this.baseUrl}`);
    this.logger.log(`Daily limit: ${this.dailyLimit}`);
  }

  getName(): string {
    return 'MyMemory';
  }

  isAvailable(): boolean {
    this.logger.log('Checking MyMemory availability - always returns true');
    return true; // Always available as it's free
  }

  async translateText(
    request: TranslationRequest,
  ): Promise<TranslationResponse> {
    this.logger.log(
      `Translating: "${request.text}" from ${request.sourceLanguage} to ${request.targetLanguage}`,
    );

    try {
      const sourceLang = this.normalizeLanguageCode(request.sourceLanguage);
      const targetLang = this.normalizeLanguageCode(request.targetLanguage);

      this.logger.log(`Normalized languages: ${sourceLang} -> ${targetLang}`);

      const response = await axios.get(`${this.baseUrl}/get`, {
        params: {
          q: request.text,
          langpair: `${sourceLang}|${targetLang}`,
        },
        timeout: 10000,
      });

      this.logger.log(`MyMemory API response status: ${response.status}`);

      if (response.data && response.data.responseData) {
        const result = {
          translatedText: response.data.responseData.translatedText,
          confidence: response.data.responseData.match,
          provider: this.getName(),
        };

        this.logger.log(`Translation successful: "${result.translatedText}"`);
        return result;
      }

      throw new Error('Invalid response from MyMemory API');
    } catch (error) {
      this.logger.error(`MyMemory error: ${error.message}`, error.stack);
      throw new Error(`MyMemory translation failed: ${error.message}`);
    }
  }

  async translateBatch(
    request: BatchTranslationRequest,
  ): Promise<BatchTranslationResponse> {
    this.logger.log(`Batch translating ${request.texts.length} texts`);

    const translations: string[] = [];

    // Add small delay between requests to respect rate limits
    for (let i = 0; i < request.texts.length; i++) {
      try {
        this.logger.log(
          `Translating batch item ${i + 1}/${request.texts.length}`,
        );

        const result = await this.translateText({
          text: request.texts[i],
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
        });
        translations.push(result.translatedText);

        // Add delay between requests (MyMemory rate limiting)
        if (i < request.texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.logger.error(
          `Batch translation failed for text: ${request.texts[i]}`,
          error,
        );
        translations.push(request.texts[i]); // Fallback to original text
      }
    }

    this.logger.log(
      `Batch translation completed: ${translations.length} results`,
    );

    return {
      translatedTexts: translations,
      provider: this.getName(),
    };
  }

  getSupportedLanguages(): string[] {
    const languages = [
      'ar',
      'bg',
      'ca',
      'zh-cn',
      'zh-tw',
      'cs',
      'da',
      'nl',
      'en',
      'et',
      'fi',
      'fr',
      'de',
      'el',
      'he',
      'hi',
      'hu',
      'id',
      'it',
      'ja',
      'ko',
      'lv',
      'lt',
      'mt',
      'no',
      'pl',
      'pt',
      'ro',
      'ru',
      'sk',
      'sl',
      'es',
      'sv',
      'th',
      'tr',
      'uk',
      'vi',
    ];

    this.logger.log(`MyMemory supports ${languages.length} languages`);
    return languages;
  }

  getMaxTextLength(): number {
    return 500; // MyMemory has a 500 character limit per request
  }

  private normalizeLanguageCode(locale: string): string {
    // MyMemory uses specific format for some languages
    const mapping: Record<string, string> = {
      'zh-CN': 'zh-cn',
      'zh-TW': 'zh-tw',
      'zh-Hans': 'zh-cn',
      'zh-Hant': 'zh-tw',
    };

    const normalized = locale.toLowerCase();
    const result = mapping[locale] || normalized.split('-')[0];

    this.logger.log(`Normalized language code: ${locale} -> ${result}`);
    return result;
  }
}
