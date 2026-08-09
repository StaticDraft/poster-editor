import type { StateCreator } from 'zustand'

export interface UISlice {
  isPreview: boolean
  setIsPreview: (val: boolean) => void
  mode: 'select'
  setMode: (mode: 'select') => void
  sidebarTab: string
  setSidebarTab: (tab: string) => void
  _leaferApp: any
  setLeaferApp: (app: any) => void
}

export const createUISlice: StateCreator<any, [], [], UISlice> = (set) => ({
  isPreview: false,
  setIsPreview: (val) => set({ isPreview: val, activeIds: [] }),
  mode: 'select',
  setMode: (mode) => set({ mode, activeIds: [] }),
  sidebarTab: 'myScenes',
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  _leaferApp: null,
  setLeaferApp: (app) => set({ _leaferApp: app }),
})
