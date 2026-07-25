import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useFeedbackStore, type FeedbackTone } from '@/lib/feedback'

const TONE_STYLES: Record<FeedbackTone, { icon: typeof Info; accent: string; panel: string; badge: string }> = {
  info: {
    icon: Info,
    accent: 'text-sky-300',
    panel: 'border-sky-500/30 bg-slate-950/92',
    badge: 'bg-sky-500/12 text-sky-200',
  },
  success: {
    icon: CheckCircle2,
    accent: 'text-emerald-300',
    panel: 'border-emerald-500/30 bg-slate-950/92',
    badge: 'bg-emerald-500/12 text-emerald-200',
  },
  warning: {
    icon: TriangleAlert,
    accent: 'text-amber-300',
    panel: 'border-amber-500/30 bg-slate-950/92',
    badge: 'bg-amber-500/12 text-amber-200',
  },
  error: {
    icon: AlertCircle,
    accent: 'text-rose-300',
    panel: 'border-rose-500/30 bg-slate-950/92',
    badge: 'bg-rose-500/12 text-rose-200',
  },
}

function ToastStack() {
  const toasts = useFeedbackStore((state) => state.toasts)
  const dismissToast = useFeedbackStore((state) => state.dismissToast)

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), toast.duration ?? 3200),
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [dismissToast, toasts])

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[500] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toast.tone || 'info'
        const style = TONE_STYLES[tone]
        const Icon = style.icon

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto overflow-hidden rounded-xl border shadow-[0_18px_48px_rgba(0,0,0,0.36)] backdrop-blur',
              style.panel,
            )}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div className={cn('mt-0.5 rounded-lg p-1.5', style.badge)}>
                <Icon className={cn('h-4 w-4', style.accent)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{toast.title}</div>
                {toast.description ? (
                  <div className="mt-1 text-xs leading-5 text-slate-300">{toast.description}</div>
                ) : null}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className={cn('h-[2px] w-full', tone === 'success' ? 'bg-emerald-400/70' : tone === 'warning' ? 'bg-amber-400/70' : tone === 'error' ? 'bg-rose-400/70' : 'bg-sky-400/70')} />
          </div>
        )
      })}
    </div>
  )
}

function DialogHost() {
  const dialog = useFeedbackStore((state) => state.dialog)
  const closeDialog = useFeedbackStore((state) => state.closeDialog)
  const resolveDialog = useFeedbackStore((state) => state.resolveDialog)
  const setPromptValue = useFeedbackStore((state) => state.setPromptValue)
  const setPromptError = useFeedbackStore((state) => state.setPromptError)

  useEffect(() => {
    if (!dialog) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog()
      if (event.key === 'Enter' && dialog.kind === 'confirm') resolveDialog(true)
      if (event.key === 'Enter' && dialog.kind === 'prompt') {
        const rawValue = dialog.value.trim()
        const error = dialog.options.validate?.(rawValue)
        if (error) {
          setPromptError(error)
          return
        }
        resolveDialog(rawValue || null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeDialog, dialog, resolveDialog, setPromptError])

  if (!dialog) return null

  const tone = dialog.options.tone || 'info'
  const style = TONE_STYLES[tone]
  const Icon = style.icon

  const submitPrompt = () => {
    if (dialog.kind !== 'prompt') return
    const rawValue = dialog.value.trim()
    const error = dialog.options.validate?.(rawValue)
    if (error) {
      setPromptError(error)
      return
    }
    resolveDialog(rawValue || null)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className={cn('w-full max-w-md rounded-2xl border shadow-[0_28px_80px_rgba(0,0,0,0.5)]', style.panel)}>
        <div className="border-b border-white/8 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className={cn('rounded-xl p-2', style.badge)}>
              <Icon className={cn('h-5 w-5', style.accent)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-white">{dialog.options.title}</div>
              {dialog.options.description ? (
                <div className="mt-1 text-sm leading-6 text-slate-300">{dialog.options.description}</div>
              ) : null}
            </div>
          </div>
        </div>

        {dialog.kind === 'prompt' ? (
          <div className="px-5 py-4">
            <Input
              autoFocus
              value={dialog.value}
              placeholder={dialog.options.placeholder}
              onChange={(event) => setPromptValue(event.target.value)}
              className="h-10 border-white/10 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:ring-sky-500"
            />
            {dialog.error ? (
              <div className="mt-2 text-xs text-rose-300">{dialog.error}</div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <Button
            variant="outline"
            onClick={() => closeDialog()}
            className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            {dialog.options.cancelLabel || 'Cancel'}
          </Button>
          <Button
            onClick={() => (dialog.kind === 'prompt' ? submitPrompt() : resolveDialog(true))}
            className={cn(
              'text-white',
              tone === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : tone === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : tone === 'error'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-sky-600 hover:bg-sky-500',
            )}
          >
            {dialog.options.confirmLabel || 'OK'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function FeedbackHost() {
  return (
    <>
      <ToastStack />
      <DialogHost />
    </>
  )
}
