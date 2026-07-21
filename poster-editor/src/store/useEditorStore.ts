import { create } from 'zustand'
import { CommandManager } from './commands/commandManager'
import {
  AddNodeCommand,
  DeleteNodesCommand,
  UpdateNodeCommand,
  UpdateNodesCommand,
  BatchUpdateNodesCommand,
  ClearNodesCommand,
} from './commands/nodeCommands'
import {
  PasteCommand,
  BringToFrontCommand,
  SendToBackCommand,
  AlignNodesCommand,
  ReorderNodesCommand,
  MoveForwardCommand,
  MoveBackwardCommand,
  CutCommand,
} from './commands/layoutCommands'

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
  props?: Record<string, any>
  animation?: {
    type: 'spin' | 'breathe' | 'none'
    duration: number
  }
}

export type HistoryFrame = { elements: EditorNode[] }

export interface CanvasConfig {
  width: number
  height: number
  bgColor: any // string | { type: 'linear'|'radial', stops: string[], from?: string, to?: string } | { type: 'image', url: string, mode?: string }
  showGrid: boolean
  scaleMode: 'auto' | 'fit-w' | 'fit-h'
  lockPan: boolean
  lockZoom: boolean
}

interface EditorState {
  canvasConfig: CanvasConfig
  setCanvasConfig: (cfg: Partial<CanvasConfig>) => void

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

  isPreview: boolean
  setIsPreview: (val: boolean) => void
  mode: 'select'
  setMode: (mode: 'select') => void
  sidebarTab: string
  setSidebarTab: (tab: string) => void

  projectName: string
  projectCategory: string
  setProjectName: (name: string) => void
  setProjectCategory: (cat: string) => void

  scenes: { id: string; name: string; category: string; lastModified: string }[]
  currentSceneId: string | null
  setCurrentSceneId: (id: string | null) => void
  loadScene: (id: string) => void
  saveScene: () => void
  createScene: (name?: string) => void
  createSceneFromCurrent: (name?: string) => string
  renameScene: (id: string, name: string) => void
  duplicateScene: (id: string, name?: string) => string | null
  deleteScene: (id: string) => void
  initScenes: () => void

  elements: EditorNode[]
  past: HistoryFrame[]
  future: HistoryFrame[]
  canUndo: boolean
  canRedo: boolean
  activeIds: string[]

  addNode: (node: EditorNode) => void
  updateNode: (id: string, attrs: Partial<EditorNode>) => void
  updateNodes: (ids: string[], attrs: Partial<EditorNode>) => void
  batchUpdateNodes: (updates: Array<{ id: string; attrs: Partial<EditorNode> }>) => void
  deleteNodes: (ids: string[]) => void
  setActiveIds: (ids: string[]) => void
  clearNodes: () => void
  setElements: (elements: EditorNode[]) => void

  undo: () => void
  redo: () => void

  _leaferApp: any
  setLeaferApp: (app: any) => void

  rulerGuides: Array<{ id: string; type: 'v' | 'h'; pos: number }>
  addRulerGuide: (guide: { type: 'v' | 'h'; pos: number }) => void
  removeRulerGuide: (id: string) => void
  clearRulerGuides: () => void

  zoomIn: () => void
  zoomOut: () => void
  zoomFit: () => void
  zoomReset: () => void
}

export const cmdManager = new CommandManager(50)

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createSceneId(existingIds: Set<string>) {
  let candidate = `scene_${Date.now()}`
  let index = 1
  while (existingIds.has(candidate)) {
    candidate = `scene_${Date.now()}_${index}`
    index += 1
  }
  existingIds.add(candidate)
  return candidate
}

export const useEditorStore = create<EditorState>((set, get) => {
  const syncHistoryState = () =>
    set({
      canUndo: cmdManager.canUndo,
      canRedo: cmdManager.canRedo,
    })

  return {
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
      set((state) => ({ canvasConfig: { ...state.canvasConfig, ...cfg } })),

    clipboard: [],
    copy: () => {
      const state = get()
      set({ clipboard: state.elements.filter((n) => state.activeIds.includes(n.id)) })
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
        const dragIndex = s.elements.findIndex((el) => el.id === arg1)
        const targetIndex = s.elements.findIndex((el) => el.id === arg2)
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

    isPreview: false,
    setIsPreview: (val) => set({ isPreview: val, activeIds: [] }),
    mode: 'select',
    setMode: (mode) => set({ mode, activeIds: [] }),
    sidebarTab: 'myScenes',
    setSidebarTab: (tab) => set({ sidebarTab: tab }),

    projectName: 'New Poster',
    projectCategory: 'Posters',
    setProjectName: (name) => set({ projectName: name }),
    setProjectCategory: (cat) => set({ projectCategory: cat }),

    scenes: [],
    currentSceneId: null,
    setCurrentSceneId: (id) => set({ currentSceneId: id }),
    initScenes: () => {
      const raw = localStorage.getItem('poster_scenes_index')
      if (raw) {
        const index = JSON.parse(raw)
        set({ scenes: index })
      }
    },
    loadScene: (id) => {
      const raw = localStorage.getItem(`poster_scene_${id}`)
      if (!raw) return
      try {
        const data = JSON.parse(raw)
        set({
          projectName: data.projectName || 'Untitled Poster',
          projectCategory: data.projectCategory || 'Posters',
          elements: data.elements || [],
          canvasConfig: data.canvasConfig || get().canvasConfig,
          currentSceneId: id,
          activeIds: [],
        })
        cmdManager.clear()
      } catch (error) {
        console.error('Failed to load scene', error)
      }
    },
    saveScene: () => {
      const state = get()
      const id = state.currentSceneId || createSceneId(new Set(state.scenes.map((scene) => scene.id)))
      const snap = {
        id,
        projectName: state.projectName,
        projectCategory: state.projectCategory,
        canvasConfig: state.canvasConfig,
        elements: state.elements,
        lastModified: new Date().toISOString(),
      }
      localStorage.setItem(`poster_scene_${id}`, JSON.stringify(snap))

      const index = state.scenes.filter((scene) => scene.id !== id)
      const newIndex = [
        {
          id,
          name: state.projectName,
          category: state.projectCategory,
          lastModified: snap.lastModified,
        },
        ...index,
      ]
      localStorage.setItem('poster_scenes_index', JSON.stringify(newIndex))
      set({ scenes: newIndex, currentSceneId: id })
    },
    createScene: (name = 'New Poster') => {
      const id = createSceneId(new Set(get().scenes.map((scene) => scene.id)))
      set({
        currentSceneId: id,
        projectName: name,
        projectCategory: 'Posters',
        elements: [],
        activeIds: [],
      })
      cmdManager.clear()
      get().saveScene()
    },
    createSceneFromCurrent: (name) => {
      const id = createSceneId(new Set(get().scenes.map((scene) => scene.id)))
      const sceneName = name?.trim() || get().projectName || '转换海报场景'
      set({
        currentSceneId: id,
        projectName: sceneName,
        projectCategory: 'Posters',
      })
      get().saveScene()
      return id
    },
    renameScene: (id, name) => {
      const nextName = name.trim()
      if (!nextName) return

      const raw = localStorage.getItem(`poster_scene_${id}`)
      if (!raw) return

      try {
        const data = JSON.parse(raw)
        const lastModified = new Date().toISOString()
        const nextData = {
          ...data,
          projectName: nextName,
          lastModified,
        }
        localStorage.setItem(`poster_scene_${id}`, JSON.stringify(nextData))

        set((state) => ({
          scenes: state.scenes.map((scene) =>
            scene.id === id
              ? { ...scene, name: nextName, lastModified }
              : scene,
          ),
          projectName: state.currentSceneId === id ? nextName : state.projectName,
        }))
      } catch (error) {
        console.error('Failed to rename scene', error)
      }
    },
    duplicateScene: (id, name) => {
      const raw = localStorage.getItem(`poster_scene_${id}`)
      if (!raw) return null

      try {
        const data = JSON.parse(raw)
        const nextId = createSceneId(new Set(get().scenes.map((scene) => scene.id)))
        const lastModified = new Date().toISOString()
        const nextName = name?.trim() || `${data.projectName || 'Poster'} Copy`
        const duplicated = {
          ...clone(data),
          id: nextId,
          projectName: nextName,
          lastModified,
        }

        localStorage.setItem(`poster_scene_${nextId}`, JSON.stringify(duplicated))

        set((state) => {
          const nextScenes = [
            {
              id: nextId,
              name: nextName,
              category: duplicated.projectCategory || 'Posters',
              lastModified,
            },
            ...state.scenes,
          ]
          localStorage.setItem('poster_scenes_index', JSON.stringify(nextScenes))
          return { scenes: nextScenes }
        })

        return nextId
      } catch (error) {
        console.error('Failed to duplicate scene', error)
        return null
      }
    },
    deleteScene: (id) => {
      set((state) => {
        const newIndex = state.scenes.filter((scene) => scene.id !== id)
        localStorage.setItem('poster_scenes_index', JSON.stringify(newIndex))
        localStorage.removeItem(`poster_scene_${id}`)
        return {
          scenes: newIndex,
          currentSceneId: state.currentSceneId === id ? null : state.currentSceneId,
        }
      })
    },

    elements: [],
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
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

    undo: () => {
      cmdManager.undo()
      syncHistoryState()
    },
    redo: () => {
      cmdManager.redo()
      syncHistoryState()
    },

    _leaferApp: null,
    setLeaferApp: (app) => set({ _leaferApp: app }),

    rulerGuides: [],
    addRulerGuide: (guide) => set((s) => ({ rulerGuides: [...s.rulerGuides, { ...guide, id: `guide-${Date.now()}` }] })),
    removeRulerGuide: (id) => set((s) => ({ rulerGuides: s.rulerGuides.filter((g) => g.id !== id) })),
    clearRulerGuides: () => set({ rulerGuides: [] }),
    zoomIn: () => {
      const app = get()._leaferApp
      if (app?.tree && typeof app.tree.zoom === 'function') app.tree.zoom('in')
    },
    zoomOut: () => {
      const app = get()._leaferApp
      if (app?.tree && typeof app.tree.zoom === 'function') app.tree.zoom('out')
    },
    zoomFit: () => {
      const app = get()._leaferApp
      const { width, height } = get().canvasConfig
      if (app?.tree && typeof app.tree.zoom === 'function') {
        try {
          app.tree.zoom({ x: 0, y: 0, width, height }, 40)
        } catch {
          app.tree.zoom('fit')
        }
      }
    },
    zoomReset: () => {
      const app = get()._leaferApp
      if (!app) return
      try {
        if (app.tree && typeof app.tree.zoom === 'function') app.tree.zoom('fit', 0)
      } catch {}
    },
  }
})
