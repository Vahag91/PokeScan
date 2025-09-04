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
import ja from './locales/ja.json';   // ⬅️ new
import nl from './locales/nl.json';   // ⬅️ new

const SUPPORTED = ['en','de','fr','es','pt','it','ja','nl']; // ⬅️ added ja,nl

const getDeviceLanguage = () => {
  if (typeof RNLocalize.findBestAvailableLanguage === 'function') {
    const best = RNLocalize.findBestAvailableLanguage(SUPPORTED);
    if (best?.languageTag) {
      return best.languageTag.split('-')[0]; // 'ja-JP' -> 'ja', 'nl-NL' -> 'nl'
    }
  }
  const locales = typeof RNLocalize.getLocales === 'function' ? RNLocalize.getLocales() : [];
  for (const l of locales) {
    const code = String(l?.languageCode || '').toLowerCase();
    if (SUPPORTED.includes(code)) return code;
  }
  return 'en';
};

i18n
  .use(ICU) // works as-is; see note below if you want locale data per lang
  .use(initReactI18next)
  .init({
    resources: {
      en:{translation:en}, de:{translation:de}, fr:{translation:fr},
      es:{translation:es}, pt:{translation:pt}, it:{translation:it},
      ja:{translation:ja}, nl:{translation:nl}, // ⬅️ added
    },
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    nonExplicitSupportedLngs: true,
    debug: __DEV__,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
