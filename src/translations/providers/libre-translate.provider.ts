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
  private readonly baseUrls: string[];
  private readonly apiKey?: string;
  private currentUrlIndex = 0;

  constructor(private configService: ConfigService) {
    // Multiple LibreTranslate instances for redundancy
    const customUrl = this.configService.get<string>('LIBRE_TRANSLATE_URL');
    this.baseUrls = customUrl
      ? [customUrl]
      : [
          'https://libretranslate.com', // Official instance
          'https://translate.argosopentech.com', // Alternative instance
          'https://libretranslate.de', // German instance
          'https://translate.mentality.rip', // Community instance
        ];

    this.apiKey = this.configService.get<string>('LIBRE_TRANSLATE_API_KEY');

    this.logger.log(
      `Initialized with ${this.baseUrls.length} LibreTranslate instances`,
    );
  }

  getName(): string {
    return 'LibreTranslate';
  }

  isAvailable(): boolean {
    return this.baseUrls.length > 0;
  }

  async translateText(
    request: TranslationRequest,
  ): Promise<TranslationResponse> {
    const sourceLang = this.normalizeLanguageCode(request.sourceLanguage);
    const targetLang = this.normalizeLanguageCode(request.targetLanguage);

    // Try each instance until one works
    // for (let attempt = 0; attempt < this.baseUrls.length; attempt++) {
    //   const baseUrl = this.baseUrls[this.currentUrlIndex];

    //   try {
    //     const payload: any = {
    //       q: request.text,
    //       source: sourceLang,
    //       target: targetLang,
    //       format: 'text',
    //     };

    //     // Add API key if available
    //     if (this.apiKey) {
    //       payload.api_key = this.apiKey;
    //     }

    //     this.logger.debug(`Attempting translation with ${baseUrl}`);

    //     const response = await axios.post(`${baseUrl}/translate`, payload, {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'User-Agent': 'LocalizationApp/1.0',
    //       },
    //       timeout: 15000, // Increased timeout
    //       validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    //     });

    //     if (response.status === 200 && response.data?.translatedText) {
    //       this.logger.debug(`Translation successful with ${baseUrl}`);
    //       return {
    //         translatedText: response.data.translatedText,
    //         provider: `${this.getName()} (${baseUrl})`,
    //       };
    //     }

    //     if (response.status === 429) {
    //       this.logger.warn(`Rate limited by ${baseUrl}, trying next instance`);
    //       this.rotateToNextInstance();
    //       continue;
    //     }

    //     if (response.status >= 400) {
    //       this.logger.warn(
    //         `HTTP ${response.status} from ${baseUrl}: ${response.data?.error || 'Unknown error'}`,
    //       );
    //       this.rotateToNextInstance();
    //       continue;
    //     }

    //     throw new Error('Invalid response format');
    //   } catch (error) {
    //     console.log(error);

    //     this.logger.warn(
    //       `LibreTranslate instance ${baseUrl} failed: ${error.message}`,
    //     );

    //     // Rotate to next instance for subsequent requests
    //     this.rotateToNextInstance();

    //     // If this is the last attempt, throw the error
    //     if (attempt === this.baseUrls.length - 1) {
    //       throw new Error(
    //         `All LibreTranslate instances failed. Last error: ${error.message}`,
    //       );
    //     }
    //   }
    // }

    const res = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: '',
        source: 'auto',
        target: 'en',
        format: 'text',
        alternatives: 3,
        api_key: '',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(await res.json());

    throw new Error('No LibreTranslate instances available');
  }

  async translateBatch(
    request: BatchTranslationRequest,
  ): Promise<BatchTranslationResponse> {
    const translations: string[] = [];
    const maxConcurrent = 3; // Limit concurrent requests

    // Process in chunks to avoid overwhelming the service
    for (let i = 0; i < request.texts.length; i += maxConcurrent) {
      const chunk = request.texts.slice(i, i + maxConcurrent);

      const chunkPromises = chunk.map(async (text, index) => {
        try {
          // Add small delay between requests
          if (index > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          const result = await this.translateText({
            text,
            sourceLanguage: request.sourceLanguage,
            targetLanguage: request.targetLanguage,
          });
          return result.translatedText;
        } catch (error) {
          this.logger.error(
            `Batch translation failed for text: ${text}`,
            error,
          );
          return text; // Fallback to original text
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      translations.push(...chunkResults);
    }

    return {
      translatedTexts: translations,
      provider: this.getName(),
    };
  }

  getSupportedLanguages(): string[] {
    // Updated list of LibreTranslate supported languages
    return [
      'ar',
      'az',
      'bg',
      'ca',
      'cs',
      'da',
      'de',
      'el',
      'en',
      'eo',
      'es',
      'et',
      'fa',
      'fi',
      'fr',
      'ga',
      'he',
      'hi',
      'hr',
      'hu',
      'id',
      'it',
      'ja',
      'ko',
      'lt',
      'lv',
      'ms',
      'mt',
      'nl',
      'no',
      'pl',
      'pt',
      'ro',
      'ru',
      'sk',
      'sl',
      'sq',
      'sv',
      'th',
      'tr',
      'uk',
      'vi',
      'zh',
    ];
  }

  getMaxTextLength(): number {
    return 5000; // LibreTranslate typical limit
  }

  private normalizeLanguageCode(locale: string): string {
    // Convert locale codes like 'en-US' to 'en'
    const baseCode = locale.split('-')[0].toLowerCase();

    // Handle special cases
    const mapping: Record<string, string> = {
      'zh-cn': 'zh',
      'zh-tw': 'zh',
      'zh-hans': 'zh',
      'zh-hant': 'zh',
    };

    return mapping[locale.toLowerCase()] || baseCode;
  }

  private rotateToNextInstance(): void {
    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.baseUrls.length;
  }

  // Health check method for monitoring
  async healthCheck(): Promise<
    { url: string; healthy: boolean; responseTime?: number }[]
  > {
    const results: { url: string; healthy: boolean; responseTime?: number }[] =
      [];

    for (const baseUrl of this.baseUrls) {
      const startTime = Date.now();
      try {
        const response = await axios.get(`${baseUrl}/languages`, {
          timeout: 5000,
          validateStatus: (status) => status < 500,
        });

        const responseTime = Date.now() - startTime;
        results.push({
          url: baseUrl,
          healthy: response.status === 200,
          responseTime,
        });
      } catch (error) {
        results.push({
          url: baseUrl,
          healthy: false,
        });
        console.error(error);
      }
    }

    return results;
  }
}
