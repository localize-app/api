// src/translations/interfaces/translation-provider.interface.ts
export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface BatchTranslationRequest {
  texts: string[];
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  confidence?: number;
  provider: string;
}

export interface BatchTranslationResponse {
  translatedTexts: string[];
  provider: string;
}

export interface TranslationProvider {
  getName(): string;
  isAvailable(): boolean;
  translateText(request: TranslationRequest): Promise<TranslationResponse>;
  translateBatch(
    request: BatchTranslationRequest,
  ): Promise<BatchTranslationResponse>;
  getSupportedLanguages(): string[];
  getMaxTextLength(): number;
}
