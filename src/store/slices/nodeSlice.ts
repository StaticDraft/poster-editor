import type { StateCreator } from 'zustand'
import type { EditorNode } from '../useEditorStore'
import { cmdManager } from './historySlice'
import {
  AddNodeCommand,
  DeleteNodesCommand,
  UpdateNodeCommand,
  UpdateNodesCommand,
  BatchUpdateNodesCommand,
  ClearNodesCommand,
} from '../commands/nodeCommands'

export interface NodeSlice {
  elements: EditorNode[]
  activeIds: string[]
  setElements: (elements: EditorNode[]) => void
  addNode: (node: EditorNode) => void
  updateNode: (id: string, attrs: Partial<EditorNode>) => void
  updateNodes: (ids: string[], attrs: Partial<EditorNode>) => void
  batchUpdateNodes: (updates: Array<{ id: string; attrs: Partial<EditorNode> }>) => void
  deleteNodes: (ids: string[]) => void
  setActiveIds: (ids: string[]) => void
  clearNodes: () => void
}

export const createNodeSlice: StateCreator<any, [], [], NodeSlice> = (set, get) => {
  const syncHistoryState = () =>
    set({
      canUndo: cmdManager.canUndo,
      canRedo: cmdManager.canRedo,
    })

  return {
    elements: [],
    activeIds: [],
    setElements: (elements) => set({ elements }),
    addNode: (node) => {
      const cmd = new AddNodeCommand(get, set, node)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    updateNode: (id, attrs) => {
      const cmd = new UpdateNodeCommand(get, set, id, attrs)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    updateNodes: (ids, attrs) => {
      const cmd = new UpdateNodesCommand(get, set, ids, attrs)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    batchUpdateNodes: (updates) => {
      const cmd = new BatchUpdateNodesCommand(get, set, updates)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    deleteNodes: (ids) => {
      const cmd = new DeleteNodesCommand(get, set, ids)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    clearNodes: () => {
      const cmd = new ClearNodesCommand(get, set)
      cmdManager.execute(cmd)
      syncHistoryState()
    },
    setActiveIds: (ids) => set({ activeIds: ids }),
  }
}
