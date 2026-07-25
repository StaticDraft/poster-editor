import { create } from 'zustand'

export type SavePhase = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type SaveStatusState = {
  phase: SavePhase
  message?: string
  lastSavedAt: number | null
  lastFingerprint: string
  setDirty: (message?: string) => void
  setSaving: (message?: string) => void
  setSaved: (fingerprint: string, savedAt?: number, message?: string) => void
  setError: (message?: string) => void
}

type EditorSaveSnapshot = {
  currentSceneId: string | null
  projectName: string
  projectCategory: string
  canvasConfig: unknown
  elements: unknown
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
  phase: 'idle',
  message: '',
  lastSavedAt: null,
  lastFingerprint: '',
  setDirty: (message) => set((state) => ({
    phase: state.phase === 'saving' ? state.phase : 'dirty',
    message: message ?? state.message,
  })),
  setSaving: (message) => set((state) => ({
    phase: 'saving',
    message: message ?? state.message,
  })),
  setSaved: (fingerprint, savedAt = Date.now(), message) => set({
    phase: 'saved',
    message,
    lastSavedAt: savedAt,
    lastFingerprint: fingerprint,
  }),
  setError: (message) => set({
    phase: 'error',
    message,
  }),
}))

export function buildEditorSaveFingerprint(snapshot: EditorSaveSnapshot) {
  return JSON.stringify({
    currentSceneId: snapshot.currentSceneId,
    projectName: snapshot.projectName,
    projectCategory: snapshot.projectCategory,
    canvasConfig: snapshot.canvasConfig,
    elements: snapshot.elements,
  })
}

export function markDirty(message?: string) {
  useSaveStatusStore.getState().setDirty(message)
}

export function markSaving(message?: string) {
  useSaveStatusStore.getState().setSaving(message)
}

export function markSaved(fingerprint: string, savedAt?: number, message?: string) {
  useSaveStatusStore.getState().setSaved(fingerprint, savedAt, message)
}

export function markSaveError(message?: string) {
  useSaveStatusStore.getState().setError(message)
}
