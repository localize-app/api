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
  private readonly maxTextLength = 500; // Max characters per request for free tier

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

    const translatedTexts: string[] = [];

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
        translatedTexts.push(result.translatedText);

        // Add delay between requests (MyMemory rate limiting)
        if (i < request.texts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.logger.error(
          `Failed to translate text at index ${i}: ${error.message}`,
        );
        // Return original text on error
        translatedTexts.push(request.texts[i]);
      }
    }

    return {
      translatedTexts,
      provider: this.getName(),
    };
  }

  getSupportedLanguages(): string[] {
    // MyMemory supports many languages, here are the most common ones
    return [
      'en',
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'ru',
      'ja',
      'ko',
      'zh',
      'ar',
      'hi',
      'tr',
      'pl',
      'nl',
      'sv',
      'da',
      'no',
      'fi',
      'cs',
      'hu',
      'el',
      'he',
      'th',
      'id',
      'ms',
      'vi',
      'uk',
      'ro',
      'bg',
      'hr',
      'sr',
      'sk',
      'sl',
      'et',
      'lv',
      'lt',
      'mt',
      'ga',
      'cy',
      'is',
      'mk',
      'sq',
      'ca',
      'eu',
      'gl',
      'af',
      'sw',
      'fil',
      'bn',
      'ta',
      'te',
      'ml',
      'kn',
      'mr',
      'gu',
      'pa',
      'ne',
      'si',
      'my',
      'km',
      'lo',
      'ka',
      'am',
      'fa',
      'ur',
      'ps',
      'sd',
      'ha',
      'yo',
      'ig',
      'zu',
      'xh',
      'jv',
      'su',
      'tg',
      'ky',
      'kk',
      'uz',
      'tk',
      'az',
      'hy',
      'mn',
      'bo',
      'la',
      'eo',
      'yi',
      'gd',
      'br',
      'bs',
      'lb',
      'oc',
      'ast',
      'co',
      'fo',
      'fy',
      'kw',
      'sc',
      'an',
      'wa',
    ];
  }

  getMaxTextLength(): number {
    return this.maxTextLength;
  }

  private normalizeLanguageCode(code: string): string {
    // MyMemory uses ISO 639-1 codes
    const langMap: Record<string, string> = {
      'en-US': 'en',
      'en-GB': 'en',
      'es-ES': 'es',
      'es-MX': 'es',
      'pt-BR': 'pt',
      'pt-PT': 'pt',
      'zh-CN': 'zh',
      'zh-TW': 'zh',
      'fr-FR': 'fr',
      'fr-CA': 'fr',
      'de-DE': 'de',
      'de-AT': 'de',
      'de-CH': 'de',
    };

    return langMap[code] || code.split('-')[0];
  }
}
