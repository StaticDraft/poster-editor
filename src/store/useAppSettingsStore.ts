import { create } from 'zustand'
import i18n from '@/locales/i18n'

export type AppLanguage = 'zh' | 'en'
export type AppTheme = 'dark' | 'light'

type AppSettingsState = {
  autoSave: boolean
  language: AppLanguage
  theme: AppTheme
  setAutoSave: (enabled: boolean) => void
  setLanguage: (language: AppLanguage) => void
  setTheme: (theme: AppTheme) => void
}

const STORAGE_KEY = 'poster_app_settings'
const DEFAULT_SETTINGS = {
  autoSave: false,
  language: 'zh' as AppLanguage,
  theme: 'dark' as AppTheme,
}

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const saved = JSON.parse(raw) as Partial<typeof DEFAULT_SETTINGS>
    return {
      autoSave: saved.autoSave === true,
      language: saved.language === 'en' ? 'en' as AppLanguage : 'zh' as AppLanguage,
      theme: saved.theme === 'light' ? 'light' as AppTheme : 'dark' as AppTheme,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function persistSettings(settings: Pick<AppSettingsState, 'autoSave' | 'language' | 'theme'>) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }
}

const initialSettings = loadSettings()
applyTheme(initialSettings.theme)
if (i18n.language !== initialSettings.language) {
  void i18n.changeLanguage(initialSettings.language)
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  ...initialSettings,
  setAutoSave: (autoSave) => {
    set({ autoSave })
    persistSettings({ ...get(), autoSave })
  },
  setLanguage: (language) => {
    set({ language })
    void i18n.changeLanguage(language)
    persistSettings({ ...get(), language })
  },
  setTheme: (theme) => {
    set({ theme })
    applyTheme(theme)
    persistSettings({ ...get(), theme })
  },
}))
