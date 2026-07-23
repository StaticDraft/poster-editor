import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import zh from './zh.json'
import { localeOverrides } from './overrides'

// Deep merge overrides into primary translation resources
const mergedEn = {
  ...en,
  ...localeOverrides.en,
  toolbar: { ...(en as any).toolbar, ...localeOverrides.en.toolbar },
  canvasConfig: { ...(en as any).canvasConfig, ...localeOverrides.en.canvasConfig },
  config: { ...(en as any).config, ...localeOverrides.en.config },
}

const mergedZh = {
  ...zh,
  ...localeOverrides.zh,
  toolbar: { ...(zh as any).toolbar, ...localeOverrides.zh.toolbar },
  canvasConfig: { ...(zh as any).canvasConfig, ...localeOverrides.zh.canvasConfig },
  config: { ...(zh as any).config, ...localeOverrides.zh.config },
}

const resources = {
  en: { translation: mergedEn },
  zh: { translation: mergedZh },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
