import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enIN from './locales/en-IN/translation.json';
import hiIN from './locales/hi-IN/translation.json';
import enUS from './locales/en-US/translation.json';
import enGB from './locales/en-GB/translation.json';
import mrIN from './locales/mr-IN/translation.json';
import guIN from './locales/gu-IN/translation.json';
import paIN from './locales/pa-IN/translation.json';
import taIN from './locales/ta-IN/translation.json';
import teIN from './locales/te-IN/translation.json';
import esES from './locales/es-ES/translation.json';
import frFR from './locales/fr-FR/translation.json';
import deDE from './locales/de-DE/translation.json';
import jaJP from './locales/ja-JP/translation.json';
import zhCN from './locales/zh-CN/translation.json';
import arSA from './locales/ar-SA/translation.json';

const resources = {
  'en-IN': { translation: enIN },
  'hi-IN': { translation: hiIN },
  'en-US': { translation: enUS },
  'en-GB': { translation: enGB },
  'mr-IN': { translation: mrIN },
  'gu-IN': { translation: guIN },
  'pa-IN': { translation: paIN },
  'ta-IN': { translation: taIN },
  'te-IN': { translation: teIN },
  'es-ES': { translation: esES },
  'fr-FR': { translation: frFR },
  'de-DE': { translation: deDE },
  'ja-JP': { translation: jaJP },
  'zh-CN': { translation: zhCN },
  'ar-SA': { translation: arSA },
};

// Use the stored language from localStorage or default to en-IN
const storedLang = localStorage.getItem('msg_lang') || 'en-IN';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLang, // Override language detector if stored in localStorage
    fallbackLng: 'en-IN',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
