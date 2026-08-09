import type { StateCreator } from 'zustand'
import { CommandManager } from '../commands/commandManager'
import type { EditorNode } from '../useEditorStore'

export type HistoryFrame = { elements: EditorNode[] }

export interface HistorySlice {
  past: HistoryFrame[]
  future: HistoryFrame[]
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  syncHistoryState: () => void
}

export const cmdManager = new CommandManager(50)

export const createHistorySlice: StateCreator<any, [], [], HistorySlice> = (set) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  syncHistoryState: () =>
    set({
      canUndo: cmdManager.canUndo,
      canRedo: cmdManager.canRedo,
    }),
  undo: () => {
    cmdManager.undo()
    set({
      canUndo: cmdManager.canUndo,
      canRedo: cmdManager.canRedo,
    })
  },
  redo: () => {
    cmdManager.redo()
    set({
      canUndo: cmdManager.canUndo,
      canRedo: cmdManager.canRedo,
    })
  },
})
