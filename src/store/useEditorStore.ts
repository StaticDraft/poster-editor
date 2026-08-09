import { create } from 'zustand'
import { createCanvasSlice, type CanvasSlice } from './slices/canvasSlice'
import { createNodeSlice, type NodeSlice } from './slices/nodeSlice'
import { createSceneSlice, type SceneSlice } from './slices/sceneSlice'
import { createClipboardSlice, type ClipboardSlice } from './slices/clipboardSlice'
import { createHistorySlice, type HistorySlice, cmdManager } from './slices/historySlice'
import { createUISlice, type UISlice } from './slices/uiSlice'

export interface EditorNode {
  id: string
  type: string
  x: number
  y: number
  width?: number
  height?: number
  fill?: string
  text?: string
  url?: string
  groupId?: string
  hidden?: boolean
  locked?: boolean
  opacity?: number
  rotation?: number
  anchorX?: number
  anchorY?: number
  props?: Record<string, any>
  animation?: {
    type: 'spin' | 'breathe' | 'none'
    duration: number
  }
}

export type { HistoryFrame } from './slices/historySlice'

export interface CanvasConfig {
  width: number
  height: number
  bgColor: any // string | { type: 'linear'|'radial', stops: string[], from?: string, to?: string } | { type: 'image', url: string, mode?: string }
  showGrid?: boolean
  showSafeMargin?: boolean
  showGridOverlay?: boolean
  scaleMode?: 'auto' | 'fit-w' | 'fit-h'
  lockPan?: boolean
  lockZoom?: boolean
}

export type EditorState = CanvasSlice &
  NodeSlice &
  SceneSlice &
  ClipboardSlice &
  HistorySlice &
  UISlice

export { cmdManager }

export const useEditorStore = create<EditorState>()((...a) => ({
  ...createCanvasSlice(...a),
  ...createNodeSlice(...a),
  ...createSceneSlice(...a),
  ...createClipboardSlice(...a),
  ...createHistorySlice(...a),
  ...createUISlice(...a),
}))
