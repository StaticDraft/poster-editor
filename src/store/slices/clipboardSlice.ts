import type { StateCreator } from 'zustand'
import type { EditorNode } from '../useEditorStore'
import { cmdManager } from './historySlice'
import {
  PasteCommand,
  BringToFrontCommand,
  SendToBackCommand,
  AlignNodesCommand,
  ReorderNodesCommand,
  MoveForwardCommand,
  MoveBackwardCommand,
  CutCommand,
} from '../commands/layoutCommands'

export interface ClipboardSlice {
  clipboard: EditorNode[]
  copy: () => void
  cut: () => void
  paste: () => void
  bringToFront: () => void
  sendToBack: () => void
  moveForward: () => void
  moveBackward: () => void
  alignNodes: (
    type:
      | 'left'
      | 'center'
      | 'right'
      | 'top'
      | 'middle'
      | 'bottom'
      | 'distribute-x'
      | 'distribute-y'
  ) => void
  reorderElements: (newElementsOrDraggedId: EditorNode[] | string, targetId?: string) => void
}

export const createClipboardSlice: StateCreator<any, [], [], ClipboardSlice> = (set, get) => {
  const syncHistoryState = () =>
    set({
      canUndo: cmdManager.canUndo,
      canRedo: cmdManager.canRedo,
    })

  return {
    clipboard: [],
    copy: () => {
      const state = get()
      set({ clipboard: state.elements.filter((n: EditorNode) => state.activeIds.includes(n.id)) })
    },
    cut: () => {
      const cmd = new CutCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    paste: () => {
      const cmd = new PasteCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    bringToFront: () => {
      const cmd = new BringToFrontCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    sendToBack: () => {
      const cmd = new SendToBackCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    moveForward: () => {
      const cmd = new MoveForwardCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    moveBackward: () => {
      const cmd = new MoveBackwardCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    alignNodes: (type) => {
      const cmd = new AlignNodesCommand(get, set, type)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    reorderElements: (arg1, arg2) => {
      let nextElements: EditorNode[] = []
      if (Array.isArray(arg1)) {
        nextElements = arg1
      } else if (typeof arg1 === 'string' && typeof arg2 === 'string') {
        const s = get()
        const dragIndex = s.elements.findIndex((el: EditorNode) => el.id === arg1)
        const targetIndex = s.elements.findIndex((el: EditorNode) => el.id === arg2)
        if (dragIndex === -1 || targetIndex === -1 || dragIndex === targetIndex) return
        const elements = [...s.elements]
        const [removed] = elements.splice(dragIndex, 1)
        elements.splice(targetIndex, 0, removed)
        nextElements = elements
      } else {
        return
      }
      const cmd = new ReorderNodesCommand(get, set, nextElements)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
  }
}
