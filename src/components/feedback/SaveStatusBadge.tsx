import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, LoaderCircle, PencilLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaveStatusStore } from '@/lib/saveStatus'

function formatTime(value: number | null) {
  if (!value) return '--:--:--'
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(value)
}

export function SaveStatusBadge() {
  const { t } = useTranslation()
  const phase = useSaveStatusStore((state) => state.phase)
  const message = useSaveStatusStore((state) => state.message)
  const lastSavedAt = useSaveStatusStore((state) => state.lastSavedAt)
  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  const content =
    phase === 'saving'
      ? {
          icon: LoaderCircle,
          label: tr('saveStatus.saving', 'Saving'),
          detail: message || tr('saveStatus.savingDesc', 'Writing latest changes'),
          className: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
          iconClassName: 'animate-spin text-sky-300',
        }
      : phase === 'saved'
        ? {
            icon: CheckCircle2,
            label: tr('saveStatus.saved', 'Saved'),
            detail: `${tr('saveStatus.savedAt', 'Saved at')} ${formatTime(lastSavedAt)}`,
            className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
            iconClassName: 'text-emerald-300',
          }
        : phase === 'error'
          ? {
              icon: AlertCircle,
              label: tr('saveStatus.error', 'Save failed'),
              detail: message || tr('saveStatus.errorDesc', 'The latest changes were not saved.'),
              className: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
              iconClassName: 'text-rose-300',
            }
          : {
              icon: PencilLine,
              label: tr('saveStatus.dirty', 'Unsaved changes'),
              detail: message || tr('saveStatus.dirtyDesc', 'Waiting for the next save cycle'),
              className: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
              iconClassName: 'text-amber-300',
            }

  const Icon = content.icon

  return (
    <div className={cn('hidden min-w-[190px] items-center gap-2 rounded-full border px-3 py-1.5 lg:flex', content.className)}>
      <Icon className={cn('h-3.5 w-3.5 shrink-0', content.iconClassName)} />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold leading-none">{content.label}</div>
        <div className="mt-0.5 truncate text-[10px] opacity-80">{content.detail}</div>
      </div>
    </div>
  )
}
