// src/translations/providers/google-translate.provider.ts
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  TranslationProvider,
  TranslationRequest,
  BatchTranslationRequest,
  TranslationResponse,
  BatchTranslationResponse,
} from '../interfaces/translation-provider.interface';

@Injectable()
export class GoogleTranslateProvider implements TranslationProvider {
  private readonly logger = new Logger(GoogleTranslateProvider.name);
  private readonly apiKey: string;
  private readonly endpoint =
    'https://translation.googleapis.com/language/translate/v2';
  private readonly maxTextLength = 5000; // Google's limit per request

  constructor(private configService: ConfigService) {
    // @ts-ignore
    this.apiKey = this.configService.get<string>('GOOGLE_TRANSLATE_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_TRANSLATE_API_KEY not set, Google Translate will not work',
      );
    }
  }

  getName(): string {
    return 'Google Translate';
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async translateText(
    request: TranslationRequest,
  ): Promise<TranslationResponse> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    try {
      const sourceLang = this.normalizeLanguageCode(request.sourceLanguage);
      const targetLang = this.normalizeLanguageCode(request.targetLanguage);

      const response = await axios.post(`${this.endpoint}?key=${this.apiKey}`, {
        q: request.text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      });

      if (response.data?.data?.translations?.length > 0) {
        return {
          translatedText: response.data.data.translations[0].translatedText,
          provider: this.getName(),
        };
      }

      throw new Error('No translation returned from Google API');
    } catch (error) {
      this.logger.error(
        `Google Translate error: ${error.message}`,
        error.stack,
      );
      throw new Error(`Google Translate failed: ${error.message}`);
    }
  }

  async translateBatch(
    request: BatchTranslationRequest,
  ): Promise<BatchTranslationResponse> {
    if (!this.apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    try {
      const sourceLang = this.normalizeLanguageCode(request.sourceLanguage);
      const targetLang = this.normalizeLanguageCode(request.targetLanguage);

      // Google Translate supports batch translation natively
      const response = await axios.post(`${this.endpoint}?key=${this.apiKey}`, {
        q: request.texts, // Array of texts
        source: sourceLang,
        target: targetLang,
        format: 'text',
      });

      if (response.data?.data?.translations?.length > 0) {
        const translatedTexts = response.data.data.translations.map(
          (t: any) => t.translatedText,
        );

        return {
          translatedTexts,
          provider: this.getName(),
        };
      }

      throw new Error('No translations returned from Google API');
    } catch (error) {
      this.logger.error(
        `Google Translate batch error: ${error.message}`,
        error.stack,
      );

      // Fallback to individual translations
      this.logger.warn('Falling back to individual translations');
      const translatedTexts: string[] = [];

      for (const text of request.texts) {
        try {
          const result = await this.translateText({
            text,
            sourceLanguage: request.sourceLanguage,
            targetLanguage: request.targetLanguage,
          });
          translatedTexts.push(result.translatedText);
        } catch (err) {
          // Return original text on error
          translatedTexts.push(text);
        }
      }

      return {
        translatedTexts,
        provider: this.getName(),
      };
    }
  }

  getSupportedLanguages(): string[] {
    // Google Translate supports 100+ languages
    return [
      'af',
      'sq',
      'am',
      'ar',
      'hy',
      'az',
      'eu',
      'be',
      'bn',
      'bs',
      'bg',
      'ca',
      'ceb',
      'ny',
      'zh',
      'zh-TW',
      'co',
      'hr',
      'cs',
      'da',
      'nl',
      'en',
      'eo',
      'et',
      'tl',
      'fi',
      'fr',
      'fy',
      'gl',
      'ka',
      'de',
      'el',
      'gu',
      'ht',
      'ha',
      'haw',
      'iw',
      'he',
      'hi',
      'hmn',
      'hu',
      'is',
      'ig',
      'id',
      'ga',
      'it',
      'ja',
      'jw',
      'kn',
      'kk',
      'km',
      'ko',
      'ku',
      'ky',
      'lo',
      'la',
      'lv',
      'lt',
      'lb',
      'mk',
      'mg',
      'ms',
      'ml',
      'mt',
      'mi',
      'mr',
      'mn',
      'my',
      'ne',
      'no',
      'or',
      'ps',
      'fa',
      'pl',
      'pt',
      'pa',
      'ro',
      'ru',
      'sm',
      'gd',
      'sr',
      'st',
      'sn',
      'sd',
      'si',
      'sk',
      'sl',
      'so',
      'es',
      'su',
      'sw',
      'sv',
      'tg',
      'ta',
      'te',
      'th',
      'tr',
      'uk',
      'ur',
      'ug',
      'uz',
      'vi',
      'cy',
      'xh',
      'yi',
      'yo',
      'zu',
    ];
  }

  getMaxTextLength(): number {
    return this.maxTextLength;
  }

  private normalizeLanguageCode(code: string): string {
    // Google uses some specific codes
    const langMap: Record<string, string> = {
      'zh-CN': 'zh',
      'zh-TW': 'zh-TW',
      he: 'iw', // Hebrew uses 'iw' in Google
      jv: 'jw', // Javanese uses 'jw' in Google
    };

    // Check if we have a specific mapping
    if (langMap[code]) {
      return langMap[code];
    }

    // For most languages, use the base code
    return code.split('-')[0];
  }
}
