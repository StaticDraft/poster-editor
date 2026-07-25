import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore, cmdManager } from './useEditorStore'

function resetStore() {
  cmdManager.clear()
  useEditorStore.setState({
    elements: [], past: [], future: [],
    canUndo: false, canRedo: false,
    activeIds: [], clipboard: [],
    scenes: [], currentSceneId: null,
    projectName: 'New File', projectCategory: 'Default',
    canvasConfig: { width: 800, height: 1200, bgColor: '#1e2430', showGrid: true, scaleMode: 'auto', lockPan: false, lockZoom: false },
    isPreview: false, mode: 'select', sidebarTab: 'system',
  })
  localStorage.clear()
}

const makeNode = (id: string, x = 0, y = 0) => ({ id, type: 'Rect', x, y, width: 100, height: 100 })

describe('useEditorStore', () => {
  beforeEach(resetStore)

  it('adds a new node safely', () => {
    const store = useEditorStore.getState()
    store.addNode({ id: 'test-1', type: 'Rect', x: 0, y: 0, width: 100, height: 100 })
    expect(useEditorStore.getState().elements.length).toBe(1)
    expect(useEditorStore.getState().elements[0].id).toBe('test-1')
  })

  it('updates an existing node correctly via partial attributes', () => {
    const store = useEditorStore.getState()
    store.addNode({ id: 'test-1', type: 'Rect', x: 0, y: 0, width: 100, height: 100 })
    store.updateNode('test-1', { x: 50, fill: '#ff0000' })
    const node = useEditorStore.getState().elements[0]
    expect(node.x).toBe(50)
    expect(node.fill).toBe('#ff0000')
  })

  // ── Node operations ──

  describe('node operations', () => {
    it('addNode increases elements length', () => {
      useEditorStore.getState().addNode(makeNode('n1'))
      useEditorStore.getState().addNode(makeNode('n2'))
      expect(useEditorStore.getState().elements).toHaveLength(2)
    })

    it('updateNodes batch-updates multiple nodes', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a', 10, 10))
      s.addNode(makeNode('b', 20, 20))
      useEditorStore.getState().updateNodes(['a', 'b'], { fill: '#000' })
      const els = useEditorStore.getState().elements
      expect(els[0].fill).toBe('#000')
      expect(els[1].fill).toBe('#000')
    })

    it('deleteNodes removes elements', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a'))
      s.addNode(makeNode('b'))
      useEditorStore.getState().deleteNodes(['a'])
      const state = useEditorStore.getState()
      expect(state.elements).toHaveLength(1)
    })

    it('deleteNodes cleans activeIds', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a'))
      s.setActiveIds(['a'])
      useEditorStore.getState().deleteNodes(['a'])
      expect(useEditorStore.getState().activeIds).toHaveLength(0)
    })

    it('clearNodes empties elements', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a'))
      useEditorStore.getState().clearNodes()
      const state = useEditorStore.getState()
      expect(state.elements).toHaveLength(0)
    })
  })

  // ── Undo / Redo ──

  describe('undo / redo', () => {
    it('updates undo and redo availability flags', () => {
      const s = useEditorStore.getState()
      expect(s.canUndo).toBe(false)
      expect(s.canRedo).toBe(false)

      s.addNode(makeNode('a'))
      expect(useEditorStore.getState().canUndo).toBe(true)
      expect(useEditorStore.getState().canRedo).toBe(false)

      useEditorStore.getState().undo()
      expect(useEditorStore.getState().canUndo).toBe(false)
      expect(useEditorStore.getState().canRedo).toBe(true)

      useEditorStore.getState().redo()
      expect(useEditorStore.getState().canUndo).toBe(true)
      expect(useEditorStore.getState().canRedo).toBe(false)
    })

    it('undo restores previous state after addNode', () => {
      useEditorStore.getState().addNode(makeNode('a'))
      expect(useEditorStore.getState().elements).toHaveLength(1)
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().elements).toHaveLength(0)
    })

    it('redo restores after undo', () => {
      useEditorStore.getState().addNode(makeNode('a'))
      useEditorStore.getState().undo()
      useEditorStore.getState().redo()
      expect(useEditorStore.getState().elements).toHaveLength(1)
    })

    it('undo is no-op when nothing to undo', () => {
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().elements).toHaveLength(0)
    })

    it('redo is no-op when nothing to redo', () => {
      useEditorStore.getState().redo()
      expect(useEditorStore.getState().elements).toHaveLength(0)
    })

    it('sequential undo/redo works correctly', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a'))
      useEditorStore.getState().addNode(makeNode('b'))
      expect(useEditorStore.getState().elements).toHaveLength(2)
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().elements).toHaveLength(1)
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().elements).toHaveLength(0)
      useEditorStore.getState().redo()
      expect(useEditorStore.getState().elements).toHaveLength(1)
      useEditorStore.getState().redo()
      expect(useEditorStore.getState().elements).toHaveLength(2)
    })
  })

  // ── Clipboard ──

  describe('clipboard', () => {
    it('paste does not create undo history when clipboard is empty', () => {
      useEditorStore.getState().paste()
      expect(useEditorStore.getState().canUndo).toBe(false)
      expect(useEditorStore.getState().elements).toHaveLength(0)
    })

    it('copy captures selected nodes', () => {
      useEditorStore.getState().addNode(makeNode('a'))
      useEditorStore.getState().setActiveIds(['a'])
      useEditorStore.getState().copy()
      expect(useEditorStore.getState().clipboard).toHaveLength(1)
    })

    it('paste creates new nodes with different IDs and offset', () => {
      useEditorStore.getState().addNode(makeNode('a', 100, 100))
      useEditorStore.getState().setActiveIds(['a'])
      useEditorStore.getState().copy()
      useEditorStore.getState().paste()
      const els = useEditorStore.getState().elements
      expect(els).toHaveLength(2)
      expect(els[1].id).not.toBe('a')
      expect(els[1].x).toBe(120) // offset +20
      expect(els[1].y).toBe(120)
    })
  })

  // ── Layer ordering ──

  describe('layer ordering', () => {
    it('bringToFront moves selected elements to end', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a'))
      useEditorStore.getState().addNode(makeNode('b'))
      useEditorStore.getState().addNode(makeNode('c'))
      useEditorStore.getState().setActiveIds(['a'])
      useEditorStore.getState().bringToFront()
      const ids = useEditorStore.getState().elements.map(e => e.id)
      expect(ids[ids.length - 1]).toBe('a')
    })

    it('sendToBack moves selected elements to beginning', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a'))
      useEditorStore.getState().addNode(makeNode('b'))
      useEditorStore.getState().addNode(makeNode('c'))
      useEditorStore.getState().setActiveIds(['c'])
      useEditorStore.getState().sendToBack()
      const ids = useEditorStore.getState().elements.map(e => e.id)
      expect(ids[0]).toBe('c')
    })
  })

  // ── Alignment ──

  describe('alignment', () => {
    it('alignNodes left aligns x values', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a', 50, 0))
      useEditorStore.getState().addNode(makeNode('b', 200, 0))
      useEditorStore.getState().setActiveIds(['a', 'b'])
      useEditorStore.getState().alignNodes('left')
      const els = useEditorStore.getState().elements
      expect(els[0].x).toBe(50)
      expect(els[1].x).toBe(50)
    })

    it('alignNodes top aligns y values', () => {
      const s = useEditorStore.getState()
      s.addNode(makeNode('a', 0, 30))
      useEditorStore.getState().addNode(makeNode('b', 0, 200))
      useEditorStore.getState().setActiveIds(['a', 'b'])
      useEditorStore.getState().alignNodes('top')
      const els = useEditorStore.getState().elements
      expect(els[0].y).toBe(30)
      expect(els[1].y).toBe(30)
    })

    it('alignNodes is no-op with less than 2 selected', () => {
      useEditorStore.getState().addNode(makeNode('a', 50, 0))
      useEditorStore.getState().setActiveIds(['a'])
      useEditorStore.getState().alignNodes('left')
      expect(useEditorStore.getState().elements[0].x).toBe(50)
    })
  })

  // ── Canvas config ──

  describe('canvas config', () => {
    it('setCanvasConfig partially updates config', () => {
      useEditorStore.getState().setCanvasConfig({ width: 800 })
      const cfg = useEditorStore.getState().canvasConfig
      expect(cfg.width).toBe(800)
      expect(cfg.height).toBe(1200) // unchanged (now default 1200)
    })
  })

  // ── Mode & Preview ──

  describe('mode & preview', () => {
    it('setMode clears activeIds', () => {
      useEditorStore.getState().addNode(makeNode('a'))
      useEditorStore.getState().setActiveIds(['a'])
      useEditorStore.getState().setMode('select')
      expect(useEditorStore.getState().mode).toBe('select')
      expect(useEditorStore.getState().activeIds).toHaveLength(0)
    })

    it('setIsPreview clears activeIds', () => {
      useEditorStore.getState().setActiveIds(['x'])
      useEditorStore.getState().setIsPreview(true)
      expect(useEditorStore.getState().isPreview).toBe(true)
      expect(useEditorStore.getState().activeIds).toHaveLength(0)
    })
  })

  // ── Scene management ──

  describe('scene management', () => {
    it('createScene adds a scene', () => {
      useEditorStore.getState().createScene('Test Scene')
      const state = useEditorStore.getState()
      expect(state.scenes.length).toBeGreaterThanOrEqual(1)
      expect(state.currentSceneId).toBeTruthy()
      expect(state.projectName).toBe('Test Scene')
    })

    it('deleteScene removes a scene', () => {
      useEditorStore.getState().createScene('To Delete')
      const id = useEditorStore.getState().currentSceneId!
      useEditorStore.getState().deleteScene(id)
      expect(useEditorStore.getState().scenes.find(s => s.id === id)).toBeUndefined()
    })

    it('saveScene persists to localStorage', () => {
      useEditorStore.getState().createScene('Persist Test')
      const id = useEditorStore.getState().currentSceneId!
      const raw = localStorage.getItem(`poster_scene_${id}`)
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw!)
      expect(data.projectName).toBe('Persist Test')
    })

    it('renameScene updates scene index and local snapshot', () => {
      useEditorStore.getState().createScene('Rename Me')
      const id = useEditorStore.getState().currentSceneId!
      useEditorStore.getState().renameScene(id, 'Renamed Scene')

      const scene = useEditorStore.getState().scenes.find(s => s.id === id)
      expect(scene?.name).toBe('Renamed Scene')

      const raw = localStorage.getItem(`poster_scene_${id}`)
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw!)
      expect(data.projectName).toBe('Renamed Scene')
    })

    it('duplicateScene creates a new stored scene copy', () => {
      const store = useEditorStore.getState()
      store.createScene('Source Scene')
      store.addNode(makeNode('a', 10, 20))
      store.saveScene()

      const sourceId = useEditorStore.getState().currentSceneId!
      const duplicateId = useEditorStore.getState().duplicateScene(sourceId, 'Source Scene Copy')

      expect(duplicateId).toBeTruthy()
      expect(duplicateId).not.toBe(sourceId)

      const duplicatedScene = useEditorStore.getState().scenes.find(s => s.id === duplicateId)
      expect(duplicatedScene?.name).toBe('Source Scene Copy')

      const raw = localStorage.getItem(`poster_scene_${duplicateId}`)
      expect(raw).toBeTruthy()
      const data = JSON.parse(raw!)
      expect(data.projectName).toBe('Source Scene Copy')
      expect(data.elements).toHaveLength(1)
    })
  })

  describe('reorderElements layer operations', () => {
    it('correctly reorders elements and supports undo/redo', () => {
      const store = useEditorStore.getState()
      store.addNode(makeNode('node-1'))
      store.addNode(makeNode('node-2'))
      store.addNode(makeNode('node-3'))
      
      expect(useEditorStore.getState().elements.map(e => e.id)).toEqual(['node-1', 'node-2', 'node-3'])
      
      // Move node-3 to index of node-1
      useEditorStore.getState().reorderElements('node-3', 'node-1')
      expect(useEditorStore.getState().elements.map(e => e.id)).toEqual(['node-3', 'node-1', 'node-2'])
      
      // Undo
      useEditorStore.getState().undo()
      expect(useEditorStore.getState().elements.map(e => e.id)).toEqual(['node-1', 'node-2', 'node-3'])
      
      // Redo
      useEditorStore.getState().redo()
      expect(useEditorStore.getState().elements.map(e => e.id)).toEqual(['node-3', 'node-1', 'node-2'])
    })
  })

})

