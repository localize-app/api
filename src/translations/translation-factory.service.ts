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
    this.providers.set(
      TranslationProviderType.LIBRE_TRANSLATE,
      this.libreTranslateProvider,
    );
    this.providers.set(TranslationProviderType.MYMEMORY, this.myMemoryProvider);
    this.providers.set(
      TranslationProviderType.GOOGLE,
      this.googleTranslateProvider,
    );
  }

  getProvider(type: TranslationProviderType): TranslationProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Translation provider ${type} not found`);
    }
    return provider;
  }

  getAvailableProviders(): {
    type: TranslationProviderType;
    name: string;
    available: boolean;
  }[] {
    return Array.from(this.providers.entries()).map(([type, provider]) => ({
      type,
      name: provider.getName(),
      available: provider.isAvailable(),
    }));
  }

  getDefaultProvider(): TranslationProvider {
    // Try to get the configured default provider
    const defaultType = this.configService.get<string>(
      'DEFAULT_TRANSLATION_PROVIDER',
    ) as TranslationProviderType;

    if (defaultType && this.providers.has(defaultType)) {
      const provider = this.providers.get(defaultType);
      if (provider?.isAvailable()) {
        return provider;
      }
    }

    // Fallback to first available free provider
    const availableProviders = this.getAvailableProviders().filter(
      (p) => p.available,
    );

    // Prefer free providers first
    const freeProviders = [
      TranslationProviderType.LIBRE_TRANSLATE,
      TranslationProviderType.MYMEMORY,
    ];
    for (const providerType of freeProviders) {
      if (availableProviders.find((p) => p.type === providerType)) {
        return this.getProvider(providerType);
      }
    }

    // If no free providers, use any available
    if (availableProviders.length > 0) {
      return this.getProvider(availableProviders[0].type);
    }

    throw new Error('No translation providers available');
  }

  async getBestProviderForLanguagePair(
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<TranslationProvider> {
    const sourceLang = sourceLanguage.split('-')[0].toLowerCase();
    const targetLang = targetLanguage.split('-')[0].toLowerCase();

    // Check which providers support both languages
    const availableProviders = this.getAvailableProviders().filter(
      (p) => p.available,
    );

    for (const providerInfo of availableProviders) {
      const provider = this.getProvider(providerInfo.type);
      const supportedLanguages = provider.getSupportedLanguages();

      if (
        supportedLanguages.includes(sourceLang) &&
        supportedLanguages.includes(targetLang)
      ) {
        return provider;
      }
    }

    // Return default if no specific match found
    return this.getDefaultProvider();
  }
}
