import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Rect, Group, Line } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/animate'
import '@leafer-in/view'
import '@leafer-in/viewport'
import '@leafer-in/scroll'
import '@leafer-in/export'
import { useEditorStore } from '@/store/useEditorStore'
import { CanvasContextMenu } from './CanvasContextMenu'
import { createLeaferNode, syncLeaferNode } from './runtime'
import { useFeedback } from '@/lib/feedback'
import { handleGlobalKeyDown } from './services/KeyboardShortcutManager'
import { handleNodeDragSnap } from './services/SnapGuideEngine'
import { createBrandWatermark, syncBrandWatermark, updateWatermarkVisibility } from '@/core/branding'
import { useLicenseStore } from '@/store/useLicenseStore'
import { bgColorToFill } from './hooks/useCanvasBackground'
import { useCanvasDragDrop } from './hooks/useCanvasDragDrop'
import { useCanvasZoomWheel } from './hooks/useCanvasZoomWheel'

export function LeaferCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<App | null>(null)
  const boardRef = useRef<any>(null)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const nodeMapRef = useRef(new Map<string, any>())
  const guideGroupRef = useRef<Group | null>(null)
  const gridOverlayGroupRef = useRef<Group | null>(null)
  const brandWatermarkRef = useRef<Group | null>(null)

  const elements = useEditorStore((state) => state.elements)
  const mode = useEditorStore((state) => state.mode)
  const isPreview = useEditorStore((state) => state.isPreview)
  const deleteNodes = useEditorStore((state) => state.deleteNodes)
  const activeIds = useEditorStore((state) => state.activeIds)
  const canvasConfig = useEditorStore((state) => state.canvasConfig)
  const rulerGuides = useEditorStore((state) => state.rulerGuides)
  const feedback = useFeedback()
  const runtimeOptions = { editable: !isPreview, draggable: !isPreview }
  const { t } = useTranslation()
  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  const showWatermark = useLicenseStore(s => s.showWatermark)
  const { handleDragOver, handleDrop } = useCanvasDragDrop(containerRef, appRef)
  useCanvasZoomWheel(containerRef, appRef)

  // 当授权状态变化时，实时刷新画布水印可见性（激活正式卡密后水印立即消失）
  useEffect(() => {
    updateWatermarkVisibility(brandWatermarkRef.current)
  }, [showWatermark])

  const getNodeGeometryUpdates = (node: any): { id: string; attrs: Partial<any> } | null => {
    if (!node?.id || node.id === '__scene_board__' || node.id === '__guide_group__') return null

    const current = useEditorStore.getState().elements.find((item) => item.id === node.id)
    if (!current) return null

    const hasAnimation = Boolean(current.animation && current.animation.type && current.animation.type !== 'none')
    const isAnimating = hasAnimation || Boolean(node.__animationRef) || isPreview

    const targetRotation = isAnimating
      ? (current.rotation ?? 0)
      : Math.round(Number(node.rotation ?? current.rotation ?? 0) * 100) / 100

    const next = {
      x: Math.round(Number(node.x ?? current.x) * 100) / 100,
      y: Math.round(Number(node.y ?? current.y) * 100) / 100,
      width: Math.round(Number(node.width ?? current.width ?? 0) * 100) / 100 || current.width,
      height: Math.round(Number(node.height ?? current.height ?? 0) * 100) / 100 || current.height,
      rotation: targetRotation,
    }

    const unchanged =
      Math.abs((current.x ?? 0) - next.x) < 0.01 &&
      Math.abs((current.y ?? 0) - next.y) < 0.01 &&
      Math.abs((current.width ?? 0) - (next.width ?? 0)) < 0.01 &&
      Math.abs((current.height ?? 0) - (next.height ?? 0)) < 0.01 &&
      Math.abs((current.rotation ?? 0) - (next.rotation ?? 0)) < 0.01

    return unchanged ? null : { id: node.id, attrs: next }
  }

  const persistEditorSelection = (app: App) => {
    const editorList = ((app as any).editor?.list || []) as any[]
    if (editorList.length === 0) return

    const updates: Array<{ id: string; attrs: Partial<any> }> = []
    editorList.forEach((node) => {
      const update = getNodeGeometryUpdates(node)
      if (update) updates.push(update)
    })

    if (updates.length > 0) {
      useEditorStore.getState().batchUpdateNodes(updates)
    }
  }

  const boardShadowRef = useRef<Rect | null>(null)

  const ensureBoardShadow = (app: App) => {
    if (boardShadowRef.current && boardShadowRef.current.destroyed) boardShadowRef.current = null
    if (!boardShadowRef.current) {
      boardShadowRef.current = new Rect({
        id: '__board_shadow__',
        x: 0,
        y: 0,
        width: canvasConfig.width,
        height: canvasConfig.height,
        fill: '#ffffff',
        stroke: 'rgba(148, 163, 184, 0.32)',
        strokeWidth: 1,
        editable: false,
        draggable: false,
        hittable: false,
        zIndex: -100001,
        shadow: '0px 12px 36px rgba(15, 23, 42, 0.35)',
      })
      app.tree.add(boardShadowRef.current)
    }
    return boardShadowRef.current
  }

  const ensureBoard = (app: App) => {
    if (boardRef.current) {
      if (boardRef.current.destroyed) {
        boardRef.current = null
      } else {
        try {
          if (boardRef.current.parent && boardRef.current.parent !== app.tree) {
            boardRef.current = null
          }
        } catch {
          boardRef.current = null
        }
      }
    }

    if (!boardRef.current) {
      boardRef.current = new Rect({
        id: '__scene_board__',
        x: 0,
        y: 0,
        width: canvasConfig.width,
        height: canvasConfig.height,
        fill: bgColorToFill(canvasConfig.bgColor),
        editable: false,
        draggable: false,
        hittable: false,
        zIndex: -100000,
      })
      app.tree.add(boardRef.current)
    }

    return boardRef.current
  }

  const ensureBrandWatermark = (app: App) => {
    if (brandWatermarkRef.current && brandWatermarkRef.current.destroyed) {
      brandWatermarkRef.current = null
    }
    if (brandWatermarkRef.current) {
      try {
        if (brandWatermarkRef.current.parent && brandWatermarkRef.current.parent !== app.tree) {
          brandWatermarkRef.current = null
        }
      } catch {
        brandWatermarkRef.current = null
      }
    }
    if (!brandWatermarkRef.current) {
      brandWatermarkRef.current = createBrandWatermark(canvasConfig.width, canvasConfig.height)
      app.tree.add(brandWatermarkRef.current)
    }
    return brandWatermarkRef.current
  }

  const ensureGuideGroup = (app: App) => {
    if (guideGroupRef.current && guideGroupRef.current.destroyed) guideGroupRef.current = null
    if (!guideGroupRef.current) {
      guideGroupRef.current = new Group({ id: '__guide_group__', zIndex: 100000, hittable: false })
      app.tree.add(guideGroupRef.current)
    }
    return guideGroupRef.current
  }

  const ensureGridOverlayGroup = (app: App) => {
    if (gridOverlayGroupRef.current && gridOverlayGroupRef.current.destroyed) gridOverlayGroupRef.current = null
    if (!gridOverlayGroupRef.current) {
      gridOverlayGroupRef.current = new Group({ id: '__grid_overlay_group__', zIndex: -90000, hittable: false })
      app.tree.add(gridOverlayGroupRef.current)
    }
    return gridOverlayGroupRef.current
  }

  // ── Sync Grid & Overlay ──
  useEffect(() => {
    const app = appRef.current
    if (!app || app.destroyed) return
    try {
      const gridOverlayGroup = ensureGridOverlayGroup(app)
      gridOverlayGroup.removeAll()

      const { width: bW, height: bH, showGrid, showSafeMargin, showGridOverlay } = canvasConfig

      if (showGrid) {
        const gridStep = 50
        for (let x = gridStep; x < bW; x += gridStep) {
          gridOverlayGroup.add(
            new Line({
              id: `__grid_overlay_mesh_v_${x}__`,
              points: [x, 0, x, bH],
              stroke: 'rgba(148, 163, 184, 0.4)',
              strokeWidth: 1,
              dashPattern: [3, 3],
              hittable: false,
            })
          )
        }
        for (let y = gridStep; y < bH; y += gridStep) {
          gridOverlayGroup.add(
            new Line({
              id: `__grid_overlay_mesh_h_${y}__`,
              points: [0, y, bW, y],
              stroke: 'rgba(148, 163, 184, 0.4)',
              strokeWidth: 1,
              dashPattern: [3, 3],
              hittable: false,
            })
          )
        }
      }

      if (showSafeMargin) {
        const insetX = bW * 0.05
        const insetY = bH * 0.05
        gridOverlayGroup.add(
          new Rect({
            id: '__grid_overlay_safe_margin__',
            x: insetX,
            y: insetY,
            width: bW - insetX * 2,
            height: bH - insetY * 2,
            stroke: '#0284c7',
            strokeWidth: 2,
            dashPattern: [6, 6],
            hittable: false,
          })
        )
      }

      if (showGridOverlay) {
        const stepX = bW / 3
        const stepY = bH / 3

        gridOverlayGroup.add(
          new Line({
            id: '__grid_overlay_v1__',
            points: [stepX, 0, stepX, bH],
            stroke: '#9333ea',
            strokeWidth: 2,
            dashPattern: [4, 4],
            hittable: false,
          })
        )
        gridOverlayGroup.add(
          new Line({
            id: '__grid_overlay_v2__',
            points: [stepX * 2, 0, stepX * 2, bH],
            stroke: '#9333ea',
            strokeWidth: 2,
            dashPattern: [4, 4],
            hittable: false,
          })
        )
        gridOverlayGroup.add(
          new Line({
            id: '__grid_overlay_h1__',
            points: [0, stepY, bW, stepY],
            stroke: '#9333ea',
            strokeWidth: 2,
            dashPattern: [4, 4],
            hittable: false,
          })
        )
        gridOverlayGroup.add(
          new Line({
            id: '__grid_overlay_h2__',
            points: [0, stepY * 2, bW, stepY * 2],
            stroke: '#9333ea',
            strokeWidth: 2,
            dashPattern: [4, 4],
            hittable: false,
          })
        )
      }
    } catch (e) {
      console.error('Grid overlay sync error:', e)
    }
  }, [canvasConfig])

  // ── Sync Canvas Background ──
  useEffect(() => {
    const app = appRef.current as any
    if (!app || app.destroyed) return
    try {
      const board = ensureBoard(app)
      const boardShadow = ensureBoardShadow(app)

      board.set({
        width: canvasConfig.width,
        height: canvasConfig.height,
        fill: bgColorToFill(canvasConfig.bgColor),
        zIndex: -100000,
      })
      boardShadow.set({
        width: canvasConfig.width,
        height: canvasConfig.height,
        zIndex: -100001,
      })
      syncBrandWatermark(ensureBrandWatermark(app), canvasConfig.width, canvasConfig.height)
    } catch (e) {
      console.error('Board background sync error:', e)
    }
  }, [canvasConfig.width, canvasConfig.height, canvasConfig.bgColor])

  // ── Engine Init & Mount ──
  useEffect(() => {
    if (!containerRef.current) return

    const app = new App({
      view: containerRef.current,
      tree: {},
      editor: { rotateAround: 'center' },
      wheel: { zoomMode: true, zoomSpeed: 0.02 },
      mobile: false,
    })

    appRef.current = app
    useEditorStore.getState().setLeaferApp(app)

    try {
      const tree = app.tree as any
      if (tree) {
        tree.scroll = true
        tree.zoom = true
        tree.wheelZoom = true
        tree.zoomLayer.config = {
          min: 0.05,
          max: 20,
        }
      }
    } catch {}

    const editor = (app as any).editor
    if (editor) {
      editor.on('select', () => {
        const list = (editor.list || []) as any[]
        const ids = list.map((item) => item.id).filter(Boolean)
        useEditorStore.getState().setActiveIds(ids)
      })

      editor.on('drag', (e: any) => {
        const guideGroup = ensureGuideGroup(app)
        handleNodeDragSnap(e.target || editor.element, app, nodeMapRef.current, guideGroup)
      })

      editor.on('drag.end', () => {
        if (guideGroupRef.current) {
          guideGroupRef.current.clear()
        }
        persistEditorSelection(app)
      })

      editor.on('rotate.end', () => {
        persistEditorSelection(app)
      })

      editor.on('scale.end', () => {
        persistEditorSelection(app)
      })

      editor.on('resize.end', () => {
        persistEditorSelection(app)
      })
    }

    app.on('pointer.down', (e: any) => {
      if (e.buttons === 2 || e.button === 2) {
        setMenuPos({ x: e.clientX, y: e.clientY })
        return
      }

      setMenuPos(null)

      const currentElements = useEditorStore.getState().elements
      let contentId: string | null = null

      let curr = e.target
      while (curr) {
        if (curr.id && typeof curr.id === 'string') {
          if (currentElements.some((el) => el.id === curr.id)) {
            contentId = curr.id
            break
          }
          if (curr.id.startsWith('__')) {
            break
          }
        }
        curr = curr.parent
      }

      if (contentId) {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          const currentActive = useEditorStore.getState().activeIds
          if (currentActive.includes(contentId)) {
            useEditorStore.getState().setActiveIds(currentActive.filter((id) => id !== contentId))
          } else {
            useEditorStore.getState().setActiveIds([...currentActive, contentId])
          }
        } else {
          useEditorStore.getState().setActiveIds([contentId])
        }
      } else {
        // 点击画布背景、空白区域、遮罩或辅助线条时，立即取消选中，使右侧面板自动返回“海报画布配置”
        useEditorStore.getState().setActiveIds([])
      }
    })

    ensureBoard(app)
    ensureBoardShadow(app)
    ensureBrandWatermark(app)

    const initialElements = useEditorStore.getState().elements
    const currentMap = nodeMapRef.current
    initialElements.forEach((el, index) => {
      const node = createLeaferNode({ ...el, zIndex: index }, runtimeOptions)
      node.zIndex = index
      app.tree.add(node)
      currentMap.set(el.id, node)
    })

    const autoFit = () => {
      try {
        useEditorStore.getState().zoomFit()
      } catch {}
    }

    requestAnimationFrame(autoFit)
    setTimeout(autoFit, 50)
    setTimeout(autoFit, 200)
    setTimeout(autoFit, 500)

    const ro = new ResizeObserver(() => {
      autoFit()
    })
    if (containerRef.current) ro.observe(containerRef.current)

    ;(window as any).__leaferZoomIn = () => useEditorStore.getState().zoomIn()
    ;(window as any).__leaferZoomOut = () => useEditorStore.getState().zoomOut()
    ;(window as any).__leaferZoomReset = () => useEditorStore.getState().zoomReset()
    ;(window as any).__leaferZoomFit = () => useEditorStore.getState().zoomFit()

    return () => {
      ro.disconnect()
      try {
        app.destroy()
      } catch {}
      appRef.current = null
      useEditorStore.getState().setLeaferApp(null)
      nodeMapRef.current.clear()
      boardRef.current = null
      boardShadowRef.current = null
      guideGroupRef.current = null
      gridOverlayGroupRef.current = null
      brandWatermarkRef.current = null
    }
  }, [])

  // ── Preview Mode Sync ──
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    elements.forEach((el) => {
      const node = nodeMapRef.current.get(el.id)
      if (node) {
        syncLeaferNode(node, el as any, runtimeOptions)
      }
    })
    if ((app as any).editor) {
      ;(app as any).editor.visible = !isPreview
    }
  }, [mode, isPreview, elements])

  // ── Selection Sync ──
  useEffect(() => {
    const app = appRef.current as any
    if (!app?.editor || isPreview) return

    const selectedNodes = activeIds.map((id) => nodeMapRef.current.get(id)).filter(Boolean)
    const nextTarget = selectedNodes.length > 0 ? selectedNodes : null
    app.editor.target = nextTarget
  }, [activeIds, isPreview, elements])

  // ── Ruler Guides Sync ──
  useEffect(() => {
    const app = appRef.current
    if (!app || app.destroyed) return
    const guideGroup = ensureGuideGroup(app)
    const oldRulerLines = guideGroup.children.filter((c: any) => c.id && String(c.id).startsWith('__ruler_guide__'))
    oldRulerLines.forEach((c: any) => c.remove())

    rulerGuides.forEach((g) => {
      if (g.type === 'v') {
        const line = new Line({
          id: `__ruler_guide__${g.id}`,
          points: [g.pos, -5000, g.pos, 10000],
          stroke: '#06b6d4',
          strokeWidth: 1,
          dashPattern: [6, 4],
          hittable: false,
        })
        guideGroup.add(line)
      } else {
        const line = new Line({
          id: `__ruler_guide__${g.id}`,
          points: [-5000, g.pos, 10000, g.pos],
          stroke: '#06b6d4',
          strokeWidth: 1,
          dashPattern: [6, 4],
          hittable: false,
        })
        guideGroup.add(line)
      }
    })
  }, [rulerGuides])

  // ── Global Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      handleGlobalKeyDown(e, {
        feedback,
        tr,
        appRef,
        nodeMapRef,
        handleKeyboardDelete: (ids: string[]) => deleteNodes(ids),
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIds, elements, deleteNodes, t])

  // ── Node Map & Element Sync ──
  useEffect(() => {
    const app = appRef.current
    if (!app || app.destroyed) return

    const currentMap = nodeMapRef.current
    const newIds = new Set<string>()

    elements.forEach((el, index) => {
      newIds.add(el.id)
      const existingNode = currentMap.get(el.id)
      if (existingNode) {
        syncLeaferNode(existingNode, { ...el, zIndex: index }, runtimeOptions)
      } else {
        const node = createLeaferNode({ ...el, zIndex: index }, runtimeOptions)
        node.zIndex = index
        app.tree.add(node)
        currentMap.set(el.id, node)
      }
    })

    currentMap.forEach((node, id) => {
      if (!newIds.has(id)) {
        node.remove()
        currentMap.delete(id)
      }
    })

    app.forceRender?.(undefined, true)
  }, [elements])

  // ── Middle Click Drag & Double Click Zoom Fit ──
  const lastMiddleClickRef = useRef<number>(0)
  const middleDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const MIDDLE_DBLCLICK_THRESHOLD_MS = 350

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()

      const now = Date.now()
      if (now - lastMiddleClickRef.current < MIDDLE_DBLCLICK_THRESHOLD_MS) {
        useEditorStore.getState().zoomFit()
        lastMiddleClickRef.current = 0
        return
      }
      lastMiddleClickRef.current = now

      const tree = (appRef.current as any)?.tree
      const zoomLayer = tree?.zoomLayer
      if (!zoomLayer) return

      middleDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: zoomLayer.x || 0,
        origY: zoomLayer.y || 0,
      }

      let rafId = 0

      const onMouseMove = (ev: MouseEvent) => {
        const drag = middleDragRef.current
        if (!drag) return
        const dx = ev.clientX - drag.startX
        const dy = ev.clientY - drag.startY

        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          zoomLayer.set({
            x: drag.origX + dx,
            y: drag.origY + dy,
          })
          appRef.current?.forceRender?.(undefined, true)
          rafId = 0
        })
      }

      const onMouseUp = () => {
        middleDragRef.current = null
        if (rafId) cancelAnimationFrame(rafId)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
  }

  const handleDoubleClick = () => {
    useEditorStore.getState().zoomFit()
  }

  const currentSceneId = useEditorStore((state) => state.currentSceneId)
  useEffect(() => {
    const timer = setTimeout(() => {
      useEditorStore.getState().zoomFit()
    }, 100)
    return () => clearTimeout(timer)
  }, [currentSceneId, canvasConfig.width, canvasConfig.height])

  return (
    <div className="flex-1 w-full h-full bg-editor-deep overflow-hidden relative shadow-inner flex items-center justify-center">
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-crosshair"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onAuxClick={(e) => e.button === 1 && e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      />

      {menuPos && <CanvasContextMenu pos={menuPos} onClose={() => setMenuPos(null)} />}
    </div>
  )
}
