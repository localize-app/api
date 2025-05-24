/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/translations/providers/google-translate.provider.ts
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

  constructor(private configService: ConfigService) {
    // @ts-ignore
    this.apiKey = this.configService.get<string>('GOOGLE_TRANSLATE_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'GOOGLE_TRANSLATE_API_KEY not set, machine translation will not work',
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

      const response = await axios.post(`${this.endpoint}?key=${this.apiKey}`, {
        q: request.texts,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      });

      if (response.data?.data?.translations) {
        return {
          translatedTexts: response.data.data.translations.map(
            (t: any) => t.translatedText,
          ),
          provider: this.getName(),
        };
      }

      throw new Error('No translations returned from Google API');
    } catch (error) {
      this.logger.error(
        `Google Translate batch error: ${error.message}`,
        error.stack,
      );
      throw new Error(`Google Translate batch failed: ${error.message}`);
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
      'zh-cn',
      'zh-tw',
      'co',
      'hr',
      'cs',
      'da',
      'nl',
      'en',
      'eo',
      'et',
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
      'jv',
      'kn',
      'kk',
      'km',
      'rw',
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
      'ny',
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
      'tl',
      'tg',
      'ta',
      'tt',
      'te',
      'th',
      'tr',
      'tk',
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
    return 30000; // Google Translate limit
  }

  private normalizeLanguageCode(locale: string): string {
    return locale.split('-')[0].toLowerCase();
  }
}
