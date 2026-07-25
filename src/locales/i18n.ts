import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import zh from './zh.json'
import { localeOverrides } from './overrides'

function deepMerge(target: any, source: any): any {
  if (!source) return target
  const output = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key])
    } else {
      output[key] = source[key]
    }
  }
  return output
}

const mergedEn = deepMerge(en, localeOverrides.en)
const mergedZh = deepMerge(zh, localeOverrides.zh)

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
