import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import zh from './zh.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh', // 强制默认中文
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React 原生防御 XSS，无需再次转义
    },
  });

export default i18n;
