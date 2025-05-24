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

  getName(): string {
    return 'MyMemory';
  }

  isAvailable(): boolean {
    return true; // Always available as it's free
  }

  async translateText(
    request: TranslationRequest,
  ): Promise<TranslationResponse> {
    try {
      const sourceLang = this.normalizeLanguageCode(request.sourceLanguage);
      const targetLang = this.normalizeLanguageCode(request.targetLanguage);

      const response = await axios.get(`${this.baseUrl}/get`, {
        params: {
          q: request.text,
          langpair: `${sourceLang}|${targetLang}`,
        },
        timeout: 10000,
      });

      if (response.data && response.data.responseData) {
        return {
          translatedText: response.data.responseData.translatedText,
          confidence: response.data.responseData.match,
          provider: this.getName(),
        };
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
    const translations: string[] = [];

    // Add small delay between requests to respect rate limits
    for (let i = 0; i < request.texts.length; i++) {
      try {
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

    return {
      translatedTexts: translations,
      provider: this.getName(),
    };
  }

  getSupportedLanguages(): string[] {
    return [
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
    return mapping[locale] || normalized.split('-')[0];
  }
}
