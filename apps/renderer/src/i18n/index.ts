import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import cs from './cs.json';
import de from './de.json';
import en from './en.json';
import fr from './fr.json';
import lt from './lt.json';
import pt from './pt.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      lt: { translation: lt },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      cs: { translation: cs }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
