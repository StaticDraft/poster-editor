import type { StateCreator } from 'zustand'
import type { CanvasConfig } from '../useEditorStore'

export interface CanvasSlice {
  canvasConfig: CanvasConfig
  setCanvasConfig: (cfg: Partial<CanvasConfig>) => void
  rulerGuides: Array<{ id: string; type: 'v' | 'h'; pos: number }>
  addRulerGuide: (guide: { type: 'v' | 'h'; pos: number }) => void
  removeRulerGuide: (id: string) => void
  clearRulerGuides: () => void
  zoomIn: () => void
  zoomOut: () => void
  zoomFit: () => void
  zoomReset: () => void
}

export const createCanvasSlice: StateCreator<any, [], [], CanvasSlice> = (set, get) => ({
  canvasConfig: {
    width: 800,
    height: 1200,
    bgColor: '#ffffff',
    showGrid: false,
    scaleMode: 'auto',
    lockPan: false,
    lockZoom: false,
  },
  setCanvasConfig: (cfg) =>
    set((state: any) => ({ canvasConfig: { ...state.canvasConfig, ...cfg } })),
  rulerGuides: [],
  addRulerGuide: (guide) =>
    set((s: any) => ({ rulerGuides: [...s.rulerGuides, { ...guide, id: `guide-${Date.now()}` }] })),
  removeRulerGuide: (id) =>
    set((s: any) => ({ rulerGuides: s.rulerGuides.filter((g: any) => g.id !== id) })),
  clearRulerGuides: () => set({ rulerGuides: [] }),
  zoomIn: () => {
    const app = get()._leaferApp
    if (!app) return
    const zoomLayer = (app.tree as any)?.zoomLayer
    if (zoomLayer) {
      const currentScale = zoomLayer.scaleX || 1
      const newScale = Math.min(20, currentScale * 1.2)
      zoomLayer.set({ scaleX: newScale, scaleY: newScale })
      app.forceRender?.(undefined, true)
    } else if (app?.tree && typeof app.tree.zoom === 'function') {
      app.tree.zoom('in')
    }
  },
  zoomOut: () => {
    const app = get()._leaferApp
    if (!app) return
    const zoomLayer = (app.tree as any)?.zoomLayer
    if (zoomLayer) {
      const currentScale = zoomLayer.scaleX || 1
      const newScale = Math.max(0.05, currentScale / 1.2)
      zoomLayer.set({ scaleX: newScale, scaleY: newScale })
      app.forceRender?.(undefined, true)
    } else if (app?.tree && typeof app.tree.zoom === 'function') {
      app.tree.zoom('out')
    }
  },
  zoomFit: () => {
    const app = get()._leaferApp
    if (!app) return
    const { width: cw, height: ch } = get().canvasConfig
    const container = (app.view as HTMLElement) || document.querySelector('.cursor-crosshair')
    const W = container?.clientWidth || container?.getBoundingClientRect().width || 0
    const H = container?.clientHeight || container?.getBoundingClientRect().height || 0

    if (W > 0 && H > 0) {
      const padding = 40
      const availW = Math.max(100, W - padding * 2)
      const availH = Math.max(100, H - padding * 2)
      const scale = Math.max(0.05, Math.min(availW / cw, availH / ch, 10))
      const targetX = (W - cw * scale) / 2
      const targetY = (H - ch * scale) / 2

      const zoomLayer = (app.tree as any)?.zoomLayer
      if (zoomLayer) {
        zoomLayer.set({
          scaleX: scale,
          scaleY: scale,
          x: targetX,
          y: targetY,
        })
        app.forceRender?.(undefined, true)
        return
      }
    }

    if (app.tree && typeof app.tree.zoom === 'function') {
      try {
        app.tree.zoom({ x: 0, y: 0, width: cw, height: ch }, 40)
      } catch (_err) {
        try {
          app.tree.zoom('fit')
        } catch (_e) {}
      }
    }
  },
  zoomReset: () => {
    const app = get()._leaferApp
    if (!app) return
    const zoomLayer = (app.tree as any)?.zoomLayer
    if (zoomLayer) {
      zoomLayer.set({ scaleX: 1, scaleY: 1 })
      app.forceRender?.(undefined, true)
    } else if (app.tree && typeof app.tree.zoom === 'function') {
      try {
        app.tree.zoom('fit', 0)
      } catch (_e) {}
    }
  },
})
