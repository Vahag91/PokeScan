// app/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ICU from 'i18next-icu';
import * as RNLocalize from 'react-native-localize';

import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import it from './locales/it.json';

const SUPPORTED = ['en','de','fr','es','pt','it'];

// Works with any react-native-localize version
const getDeviceLanguage = () => {
  // Prefer newer API if available
  if (typeof RNLocalize.findBestAvailableLanguage === 'function') {
    const best = RNLocalize.findBestAvailableLanguage(SUPPORTED);
    if (best?.languageTag) {
      const language = best.languageTag.split('-')[0];
      console.log('🌍 i18n Debug (new API):', {
        detected: best.languageTag,
        selected: language,
        supported: SUPPORTED,
        bestMatch: best
      });
      return language;
    }
  }

  // Fallback: check device locales manually
  const locales = (typeof RNLocalize.getLocales === 'function')
    ? RNLocalize.getLocales()
    : [];
  
  for (const l of locales) {
    const code = String(l?.languageCode || '').toLowerCase(); // e.g. "pt"
    if (SUPPORTED.includes(code)) {
      console.log('🌍 i18n Debug (fallback):', {
        detected: l.languageCode,
        selected: code,
        supported: SUPPORTED
      });
      return code;
    }
  }
  
  console.log('🌍 i18n Debug (default):', {
    detected: 'none',
    selected: 'en',
    supported: SUPPORTED
  });
  return 'en';
};

i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
      it: { translation: it },
    },
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    nonExplicitSupportedLngs: true,
    debug: __DEV__,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

// Log after initialization
setTimeout(() => {
  console.log('✅ i18n initialized with language:', i18n.language);
  console.log('📚 Available languages:', Object.keys(i18n.store.data));
}, 100);

export default i18n;
