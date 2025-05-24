// src/translations/providers/libre-translate.provider.ts
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
export class LibreTranslateProvider implements TranslationProvider {
  private readonly logger = new Logger(LibreTranslateProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(private configService: ConfigService) {
    // Use public LibreTranslate instance or your own
    this.baseUrl =
      this.configService.get<string>('LIBRE_TRANSLATE_URL') ||
      'https://libretranslate.de';
    this.apiKey = this.configService.get<string>('LIBRE_TRANSLATE_API_KEY');
  }

  getName(): string {
    return 'LibreTranslate';
  }

  isAvailable(): boolean {
    return !!this.baseUrl;
  }

  async translateText(
    request: TranslationRequest,
  ): Promise<TranslationResponse> {
    try {
      const sourceLang = this.normalizeLanguageCode(request.sourceLanguage);
      const targetLang = this.normalizeLanguageCode(request.targetLanguage);

      const payload: any = {
        q: request.text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      };

      // Add API key if available
      if (this.apiKey) {
        payload.api_key = this.apiKey;
      }

      const response = await axios.post(`${this.baseUrl}/translate`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      return {
        translatedText: response.data.translatedText,
        provider: this.getName(),
      };
    } catch (error) {
      this.logger.error(`LibreTranslate error: ${error.message}`, error.stack);
      throw new Error(`LibreTranslate translation failed: ${error.message}`);
    }
  }

  async translateBatch(
    request: BatchTranslationRequest,
  ): Promise<BatchTranslationResponse> {
    // LibreTranslate doesn't have native batch support, so we'll do sequential requests
    const translations: string[] = [];

    for (const text of request.texts) {
      try {
        const result = await this.translateText({
          text,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
        });
        translations.push(result.translatedText);
      } catch (error) {
        this.logger.error(`Batch translation failed for text: ${text}`, error);
        translations.push(text); // Fallback to original text
      }
    }

    return {
      translatedTexts: translations,
      provider: this.getName(),
    };
  }

  getSupportedLanguages(): string[] {
    // LibreTranslate supported languages (as of 2024)
    return [
      'ar',
      'az',
      'ca',
      'zh',
      'cs',
      'da',
      'nl',
      'en',
      'eo',
      'fi',
      'fr',
      'de',
      'el',
      'hi',
      'hu',
      'id',
      'ga',
      'it',
      'ja',
      'ko',
      'fa',
      'pl',
      'pt',
      'ru',
      'sk',
      'es',
      'sv',
      'tr',
      'uk',
    ];
  }

  getMaxTextLength(): number {
    return 5000; // LibreTranslate typical limit
  }

  private normalizeLanguageCode(locale: string): string {
    // Convert locale codes like 'en-US' to 'en'
    return locale.split('-')[0].toLowerCase();
  }
}
