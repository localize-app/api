// Centralized language definitions for the entire application
// This is the single source of truth for all supported languages
// Keep in sync with frontend: app-dashboard/src/constants/languages.ts

export interface SystemLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SYSTEM_LANGUAGES: SystemLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
  {
    code: 'es-AR',
    name: 'Spanish (Argentina)',
    nativeName: 'Español (Argentina)',
  },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
  },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文(简体)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文(繁體)' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
];

// Helper functions
export const getLanguageByCode = (code: string): SystemLanguage | undefined => {
  return SYSTEM_LANGUAGES.find((lang) => lang.code === code);
};

export const getLanguageName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language ? language.name : code;
};

export const getLanguageNativeName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language ? language.nativeName : code;
};

export const isValidLanguageCode = (code: string): boolean => {
  return SYSTEM_LANGUAGES.some((lang) => lang.code === code);
};

// Validation for project language arrays
export const validateLanguageCodes = (
  codes: string[],
): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  codes.forEach((code) => {
    if (isValidLanguageCode(code)) {
      valid.push(code);
    } else {
      invalid.push(code);
    }
  });

  return { valid, invalid };
};
