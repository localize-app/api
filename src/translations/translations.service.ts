/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslationsService {
  private readonly logger = new Logger(TranslationsService.name);
  private readonly apiKey: string;
  private readonly translationEndpoint: string =
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

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en',
  ): Promise<string> {
    try {
      // Handle empty text
      if (!text.trim()) {
        return '';
      }

      // Convert locale format (e.g., 'en-US' to 'en')
      const sourceLang = sourceLanguage.split('-')[0];
      const targetLang = targetLanguage.split('-')[0];

      const response = await axios.post(
        `${this.translationEndpoint}?key=${this.apiKey}`,
        {
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        },
      );
      console.log(`Response: ${JSON.stringify(response.data)}`);

      if (
        response.data &&
        response.data.data &&
        response.data.data.translations &&
        response.data.data.translations.length > 0
      ) {
        return response.data.data.translations[0].translatedText;
      }

      throw new Error('No translation returned from API');
    } catch (error) {
      this.logger.error(`Translation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'en',
  ): Promise<string[]> {
    try {
      if (texts.length === 0) {
        return [];
      }

      // Convert locale format
      const sourceLang = sourceLanguage.split('-')[0];
      const targetLang = targetLanguage.split('-')[0];

      const response = await axios.post(
        `${this.translationEndpoint}?key=${this.apiKey}`,
        {
          q: texts,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        },
      );

      if (
        response.data &&
        response.data.data &&
        response.data.data.translations
      ) {
        return response.data.data.translations.map(
          (t: any) => t.translatedText,
        );
      }

      throw new Error('No translations returned from API');
    } catch (error) {
      this.logger.error(
        `Batch translation error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
