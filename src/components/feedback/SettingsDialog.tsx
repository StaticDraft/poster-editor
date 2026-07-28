import { Settings2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAppSettingsStore, type AppLanguage, type AppTheme } from '@/store/useAppSettingsStore'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { t } = useTranslation()
  const autoSave = useAppSettingsStore((state) => state.autoSave)
  const language = useAppSettingsStore((state) => state.language)
  const theme = useAppSettingsStore((state) => state.theme)
  const setAutoSave = useAppSettingsStore((state) => state.setAutoSave)
  const setLanguage = useAppSettingsStore((state) => state.setLanguage)
  const setTheme = useAppSettingsStore((state) => state.setTheme)

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Settings2 className="h-4 w-4 text-blue-400" />
            {tr('settings.title', '设置')}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title={tr('common.close', '关闭')}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tr('settings.editor', '编辑器')}
            </h3>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-3 py-3">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs font-semibold">{tr('settings.autoSave', '实时保存')}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {tr('settings.autoSaveDesc', '开启后会在编辑变更后自动保存当前场景')}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoSave}
                onClick={() => setAutoSave(!autoSave)}
                className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full border border-border/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${autoSave ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}
                title={tr('settings.autoSave', '实时保存')}
              >
                <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200 ${autoSave ? 'left-6' : ''}`} />
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {tr('settings.appearance', '外观与语言')}
            </h3>
            <label className="flex items-center justify-between gap-4 text-xs">
              <span>{tr('settings.language', '界面语言')}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as AppLanguage)}
                className="w-36 rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="zh">简体中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-4 text-xs">
              <span>{tr('settings.theme', '主题')}</span>
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value as AppTheme)}
                className="w-36 rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="dark">{tr('settings.dark', '深色')}</option>
                <option value="light">{tr('settings.light', '浅色')}</option>
              </select>
            </label>
          </section>
        </div>

        <div className="flex justify-end border-t border-border bg-muted/20 px-5 py-3">
          <Button size="sm" onClick={onClose}>{tr('common.close', '关闭')}</Button>
        </div>
      </div>
    </div>
  )
}
