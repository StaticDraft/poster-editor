import type { StateCreator } from 'zustand'
import { saveTemplateOverride } from '@/lib/templatePreferences'
import { cmdManager } from './historySlice'

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

export interface SceneSlice {
  projectName: string
  projectCategory: string
  setProjectName: (name: string) => void
  setProjectCategory: (cat: string) => void
  scenes: { id: string; name: string; category: string; lastModified: string }[]
  currentSceneId: string | null
  editingTemplateId: string | null
  setCurrentSceneId: (id: string | null) => void
  setEditingTemplateId: (id: string | null) => void
  loadScene: (id: string) => void
  saveScene: () => void
  saveTemplate: () => boolean
  createScene: (name?: string) => void
  createSceneFromCurrent: (name?: string) => string
  renameScene: (id: string, name: string) => void
  duplicateScene: (id: string, name?: string) => string | null
  deleteScene: (id: string) => void
  initScenes: () => void
}

export const createSceneSlice: StateCreator<any, [], [], SceneSlice> = (set, get) => ({
  projectName: 'New Poster',
  projectCategory: 'Posters',
  setProjectName: (name) => set({ projectName: name }),
  setProjectCategory: (cat) => set({ projectCategory: cat }),

  scenes: [],
  currentSceneId: null,
  editingTemplateId: null,
  setCurrentSceneId: (id) => set({ currentSceneId: id }),
  setEditingTemplateId: (id) => set({ editingTemplateId: id }),
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
        editingTemplateId: null,
        activeIds: [],
      })
      cmdManager.clear()
    } catch (error) {
      console.error('Failed to load scene', error)
    }
  },
  saveScene: () => {
    const state = get()
    const id = state.currentSceneId || createSceneId(new Set(state.scenes.map((scene: any) => scene.id)))
    const snap = {
      id,
      projectName: state.projectName,
      projectCategory: state.projectCategory,
      canvasConfig: state.canvasConfig,
      elements: state.elements,
      lastModified: new Date().toISOString(),
    }
    localStorage.setItem(`poster_scene_${id}`, JSON.stringify(snap))

    const index = state.scenes.filter((scene: any) => scene.id !== id)
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
  saveTemplate: () => {
    const state = get()
    if (!state.editingTemplateId) return false

    saveTemplateOverride(state.editingTemplateId, {
      canvasConfig: {
        width: state.canvasConfig.width,
        height: state.canvasConfig.height,
        bgColor: state.canvasConfig.bgColor,
      },
      elements: state.elements,
    })
    return true
  },
  createScene: (name = 'New Poster') => {
    const id = createSceneId(new Set(get().scenes.map((scene: any) => scene.id)))
    set({
      currentSceneId: id,
      editingTemplateId: null,
      projectName: name,
      projectCategory: 'Posters',
      elements: [],
      activeIds: [],
    })
    cmdManager.clear()
    get().saveScene()
  },
  createSceneFromCurrent: (name) => {
    const id = createSceneId(new Set(get().scenes.map((scene: any) => scene.id)))
    const sceneName = name?.trim() || get().projectName || '转换海报场景'
    set({
      currentSceneId: id,
      editingTemplateId: null,
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

      set((state: any) => ({
        scenes: state.scenes.map((scene: any) =>
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
      const nextId = createSceneId(new Set(get().scenes.map((scene: any) => scene.id)))
      const lastModified = new Date().toISOString()
      const nextName = name?.trim() || `${data.projectName || 'Poster'} Copy`
      const duplicated = {
        ...clone(data),
        id: nextId,
        projectName: nextName,
        lastModified,
      }

      localStorage.setItem(`poster_scene_${nextId}`, JSON.stringify(duplicated))

      set((state: any) => {
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
    set((state: any) => {
      const newIndex = state.scenes.filter((scene: any) => scene.id !== id)
      localStorage.setItem('poster_scenes_index', JSON.stringify(newIndex))
      localStorage.removeItem(`poster_scene_${id}`)
      return {
        scenes: newIndex,
        currentSceneId: state.currentSceneId === id ? null : state.currentSceneId,
      }
    })
  },
})
