import { create } from 'zustand'

export type FeedbackTone = 'info' | 'success' | 'warning' | 'error'

export interface ToastOptions {
  title: string
  description?: string
  tone?: FeedbackTone
  duration?: number
}

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: FeedbackTone
}

export interface PromptOptions extends ConfirmOptions {
  defaultValue?: string
  placeholder?: string
  validate?: (value: string) => string | null
}

type ToastRecord = ToastOptions & {
  id: string
  createdAt: number
}

type ConfirmDialogState = {
  kind: 'confirm'
  options: ConfirmOptions
  resolve: (value: boolean) => void
}

type PromptDialogState = {
  kind: 'prompt'
  options: PromptOptions
  value: string
  error: string
  resolve: (value: string | null) => void
}

type DialogState = ConfirmDialogState | PromptDialogState | null

type FeedbackState = {
  toasts: ToastRecord[]
  dialog: DialogState
  pushToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
  openConfirm: (options: ConfirmOptions) => Promise<boolean>
  openPrompt: (options: PromptOptions) => Promise<string | null>
  closeDialog: () => void
  resolveDialog: (value: boolean | string | null) => void
  setPromptValue: (value: string) => void
  setPromptError: (error: string) => void
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  toasts: [],
  dialog: null,
  pushToast: (options) => {
    const id = createId('toast')
    set((state) => {
      const nextToasts = [
        ...state.toasts,
        {
          id,
          createdAt: Date.now(),
          tone: options.tone || 'info',
          duration: options.duration ?? 2500,
          ...options,
        },
      ].slice(-2) // Keep at most 2 toasts to avoid UI blockage
      return { toasts: nextToasts }
    })
    return id
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((item) => item.id !== id),
    }))
  },
  openConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      const existing = get().dialog
      if (existing) {
        if (existing.kind === 'confirm') existing.resolve(false)
        else existing.resolve(null)
      }
      set({
        dialog: {
          kind: 'confirm',
          options,
          resolve,
        },
      })
    }),
  openPrompt: (options) =>
    new Promise<string | null>((resolve) => {
      const existing = get().dialog
      if (existing) {
        if (existing.kind === 'confirm') existing.resolve(false)
        else existing.resolve(null)
      }
      set({
        dialog: {
          kind: 'prompt',
          options,
          value: options.defaultValue || '',
          error: '',
          resolve,
        },
      })
    }),
  closeDialog: () => {
    const current = get().dialog
    if (!current) return
    if (current.kind === 'confirm') current.resolve(false)
    else current.resolve(null)
    set({ dialog: null })
  },
  resolveDialog: (value) => {
    const current = get().dialog
    if (!current) return
    if (current.kind === 'confirm') current.resolve(Boolean(value))
    else current.resolve(typeof value === 'string' ? value : null)
    set({ dialog: null })
  },
  setPromptValue: (value) => {
    set((state) => {
      if (!state.dialog || state.dialog.kind !== 'prompt') return state
      return {
        dialog: {
          ...state.dialog,
          value,
          error: '',
        },
      }
    })
  },
  setPromptError: (error) => {
    set((state) => {
      if (!state.dialog || state.dialog.kind !== 'prompt') return state
      return {
        dialog: {
          ...state.dialog,
          error,
        },
      }
    })
  },
}))

export function notify(options: ToastOptions) {
  return useFeedbackStore.getState().pushToast(options)
}

export function dismissNotification(id: string) {
  useFeedbackStore.getState().dismissToast(id)
}

export function requestConfirm(options: ConfirmOptions) {
  return useFeedbackStore.getState().openConfirm(options)
}

export function requestPrompt(options: PromptOptions) {
  return useFeedbackStore.getState().openPrompt(options)
}

export function useFeedback() {
  return {
    notify,
    confirm: requestConfirm,
    prompt: requestPrompt,
    dismiss: dismissNotification,
  }
}
