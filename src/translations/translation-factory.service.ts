// src/translations/translation-factory.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslationProvider } from './interfaces/translation-provider.interface';
import { LibreTranslateProvider } from './providers/libre-translate.provider';
import { MyMemoryProvider } from './providers/mymemory.provider';
import { GoogleTranslateProvider } from './providers/google-translate.provider';
import { TranslationProviderType } from './enums/translation-provider.enum';

@Injectable()
export class TranslationFactoryService {
  private readonly logger = new Logger(TranslationFactoryService.name);
  private readonly providers = new Map<
    TranslationProviderType,
    TranslationProvider
  >();

  constructor(
    private configService: ConfigService,
    private libreTranslateProvider: LibreTranslateProvider,
    private myMemoryProvider: MyMemoryProvider,
    private googleTranslateProvider: GoogleTranslateProvider,
  ) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.logger.log('Initializing translation providers...');

    try {
      // Initialize LibreTranslate
      // this.providers.set(
      //   TranslationProviderType.LIBRE_TRANSLATE,
      //   this.libreTranslateProvider,
      // );
      // this.logger.log('LibreTranslate provider initialized');

      // Initialize MyMemory
      this.providers.set(
        TranslationProviderType.MYMEMORY,
        this.myMemoryProvider,
      );
      this.logger.log('MyMemory provider initialized');

      // Initialize Google Translate
      this.providers.set(
        TranslationProviderType.GOOGLE,
        this.googleTranslateProvider,
      );
      this.logger.log('Google Translate provider initialized');

      // Log all initialized providers
      this.logger.log(`Total providers initialized: ${this.providers.size}`);
      this.logger.log(
        `Available providers: ${Array.from(this.providers.keys()).join(', ')}`,
      );
    } catch (error) {
      this.logger.error('Error initializing translation providers:', error);
    }
  }

  getProvider(type: TranslationProviderType): TranslationProvider {
    this.logger.log(`Attempting to get provider: ${type}`);
    this.logger.log(
      `Available provider types: ${Array.from(this.providers.keys()).join(', ')}`,
    );

    const provider = this.providers.get(type);
    if (!provider) {
      this.logger.error(
        `Translation provider ${type} not found in providers map`,
      );
      this.logger.error(`Current providers map size: ${this.providers.size}`);
      throw new Error(`Translation provider ${type} not found`);
    }

    this.logger.log(
      `Successfully retrieved ${type} provider: ${provider.getName()}`,
    );
    return provider;
  }

  getAvailableProviders(): {
    type: TranslationProviderType;
    name: string;
    available: boolean;
  }[] {
    this.logger.log('Getting available providers...');
    const result = Array.from(this.providers.entries()).map(
      ([type, provider]) => {
        const isAvailable = provider.isAvailable();
        this.logger.log(
          `Provider ${type} (${provider.getName()}): ${isAvailable ? 'available' : 'not available'}`,
        );
        return {
          type,
          name: provider.getName(),
          available: isAvailable,
        };
      },
    );

    this.logger.log(`Returning ${result.length} providers`);
    return result;
  }

  getDefaultProvider(): TranslationProvider {
    this.logger.log('Getting default provider...');

    // Try to get the configured default provider
    const defaultType = this.configService.get<string>(
      'DEFAULT_TRANSLATION_PROVIDER',
    ) as TranslationProviderType;

    if (defaultType && this.providers.has(defaultType)) {
      const provider = this.providers.get(defaultType);
      if (provider?.isAvailable()) {
        this.logger.log(`Using configured default provider: ${defaultType}`);
        return provider;
      }
    }

    // Fallback to first available free provider
    const availableProviders = this.getAvailableProviders().filter(
      (p) => p.available,
    );

    this.logger.log(`Found ${availableProviders.length} available providers`);

    // Prefer free providers first
    const freeProviders = [
      TranslationProviderType.LIBRE_TRANSLATE,
      TranslationProviderType.MYMEMORY,
    ];

    for (const providerType of freeProviders) {
      if (availableProviders.find((p) => p.type === providerType)) {
        this.logger.log(`Using free provider: ${providerType}`);
        return this.getProvider(providerType);
      }
    }

    // If no free providers, use any available
    if (availableProviders.length > 0) {
      this.logger.log(
        `Using first available provider: ${availableProviders[0].type}`,
      );
      return this.getProvider(availableProviders[0].type);
    }

    this.logger.error('No translation providers available');
    throw new Error('No translation providers available');
  }

  async getBestProviderForLanguagePair(
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<TranslationProvider> {
    this.logger.log(
      `Finding best provider for ${sourceLanguage} -> ${targetLanguage}`,
    );

    const sourceLang = sourceLanguage.split('-')[0].toLowerCase();
    const targetLang = targetLanguage.split('-')[0].toLowerCase();

    // Check which providers support both languages
    const availableProviders = this.getAvailableProviders().filter(
      (p) => p.available,
    );

    this.logger.log(
      `Checking ${availableProviders.length} available providers for language support`,
    );

    for (const providerInfo of availableProviders) {
      const provider = this.getProvider(providerInfo.type);
      const supportedLanguages = provider.getSupportedLanguages();

      this.logger.log(
        `${providerInfo.type} supports: ${supportedLanguages.length} languages`,
      );

      if (
        supportedLanguages.includes(sourceLang) &&
        supportedLanguages.includes(targetLang)
      ) {
        this.logger.log(`Using ${providerInfo.type} for language pair`);
        return provider;
      }
    }

    // Return default if no specific match found
    this.logger.log(
      'No specific language support found, using default provider',
    );
    return this.getDefaultProvider();
  }
}
