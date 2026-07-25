import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { App, PointerEvent, DragEvent, Rect, Group, Line } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/animate'
import '@leafer-in/view'
import '@leafer-in/viewport'
import '@leafer-in/scroll'
import '@leafer-in/export'
import { useEditorStore } from '@/store/useEditorStore'
import { CanvasContextMenu } from './CanvasContextMenu'
import { applyAnimation, createLeaferNode, syncLeaferNode } from './runtime'
import { useFeedback } from '@/lib/feedback'
import { handleGlobalKeyDown } from './services/KeyboardShortcutManager'
import { handleNodeDragSnap } from './services/SnapGuideEngine'

export function LeaferCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<App | null>(null)
  const boardRef = useRef<any>(null)
  const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null)
  const nodeMapRef = useRef(new Map<string, any>())
  const guideGroupRef = useRef<Group | null>(null)
  const gridOverlayGroupRef = useRef<Group | null>(null)

  const elements = useEditorStore((state) => state.elements)
  const mode = useEditorStore((state) => state.mode)
  const isPreview = useEditorStore((state) => state.isPreview)
  const deleteNodes = useEditorStore((state) => state.deleteNodes)
  const activeIds = useEditorStore((state) => state.activeIds)
  const canvasConfig = useEditorStore((state) => state.canvasConfig)
  const feedback = useFeedback()
  const runtimeOptions = { editable: !isPreview, draggable: !isPreview }
  const { t } = useTranslation()
  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }


  const getNodeGeometryUpdates = (node: any): { id: string; attrs: Partial<any> } | null => {
    if (!node?.id || node.id === '__scene_board__' || node.id === '__guide_group__') return null

    const current = useEditorStore.getState().elements.find((item) => item.id === node.id)
    if (!current) return null

    // Isolate animation preview state from persistent editor store
    const isAnimating = Boolean(node.__animationRef) || isPreview
    const targetRotation = isAnimating
      ? (node.__initialRotation !== undefined ? node.__initialRotation : (current.rotation ?? 0))
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

  // ── Convert bgColor config to Leafer fill ──
  const bgColorToFill = (bgColor: any): any => {
    if (!bgColor) return '#ffffff'
    if (typeof bgColor === 'string') return bgColor
    if (typeof bgColor === 'object') {
      if (bgColor.type === 'image' && bgColor.url) {
        return { type: 'image', url: bgColor.url, mode: bgColor.mode || 'cover' }
      }
      if ((bgColor.type === 'linear' || bgColor.type === 'radial') && Array.isArray(bgColor.stops)) {
        const dirMap: Record<string, string> = {
          'top': 'to bottom', 'bottom': 'to top',
          'left': 'to right', 'right': 'to left',
          'top-left': 'to bottom right', 'center': 'to bottom',
        }
        if (bgColor.type === 'radial') {
          return {
            type: 'radial',
            stops: bgColor.stops.map((c: string, i: number, arr: string[]) => ({
              offset: i / Math.max(1, arr.length - 1),
              color: c,
            })),
          }
        }
        return {
          type: 'linear',
          from: dirMap[bgColor.from] || 'to bottom',
          stops: bgColor.stops.map((c: string, i: number, arr: string[]) => ({
            offset: i / Math.max(1, arr.length - 1),
            color: c,
          })),
        }
      }
    }
    return '#ffffff'
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
    // Discard board if it was destroyed or belongs to a different/old App tree
    if (boardRef.current) {
      if (boardRef.current.destroyed) {
        boardRef.current = null
      } else {
        try {
          // If the board's parent is not the current app's tree, it's stale
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

  // Bind canvas config changes to Leafer
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
    } catch (e) {
      console.error('Board background sync error:', e)
    }

    // Safe Margin, 3x3 Grid Overlay & Mesh Grid Renderer
    try {
      const gridOverlayGroup = ensureGridOverlayGroup(app)
      gridOverlayGroup.removeAll()

      const { width: bW, height: bH, showGrid, showSafeMargin, showGridOverlay } = canvasConfig

      // 1. Base 50px Canvas Grid Mesh (显示网格)
      if (showGrid) {
        const gridStep = 50
        for (let x = gridStep; x < bW; x += gridStep) {
          gridOverlayGroup.add(new Line({
            id: `__grid_overlay_mesh_v_${x}__`,
            points: [x, 0, x, bH],
            stroke: 'rgba(148, 163, 184, 0.4)',
            strokeWidth: 1,
            dashPattern: [3, 3],
            hittable: false,
          }))
        }
        for (let y = gridStep; y < bH; y += gridStep) {
          gridOverlayGroup.add(new Line({
            id: `__grid_overlay_mesh_h_${y}__`,
            points: [0, y, bW, y],
            stroke: 'rgba(148, 163, 184, 0.4)',
            strokeWidth: 1,
            dashPattern: [3, 3],
            hittable: false,
          }))
        }
      }

      // 2. Safe Bleed Margin 5% (显示 5% 出血安全边距)
      if (showSafeMargin) {
        const insetX = bW * 0.05
        const insetY = bH * 0.05
        gridOverlayGroup.add(new Rect({
          id: '__grid_overlay_safe_margin__',
          x: insetX,
          y: insetY,
          width: bW - insetX * 2,
          height: bH - insetY * 2,
          stroke: '#0284c7',
          strokeWidth: 2,
          dashPattern: [6, 6],
          hittable: false,
        }))
      }

      // 3. Rule of Thirds 3x3 Grid Overlay (显示三分构图辅助网格)
      if (showGridOverlay) {
        const stepX = bW / 3
        const stepY = bH / 3

        gridOverlayGroup.add(new Line({
          id: '__grid_overlay_v1__',
          points: [stepX, 0, stepX, bH],
          stroke: '#9333ea',
          strokeWidth: 2,
          dashPattern: [4, 4],
          hittable: false,
        }))
        gridOverlayGroup.add(new Line({
          id: '__grid_overlay_v2__',
          points: [stepX * 2, 0, stepX * 2, bH],
          stroke: '#9333ea',
          strokeWidth: 2,
          dashPattern: [4, 4],
          hittable: false,
        }))
        gridOverlayGroup.add(new Line({
          id: '__grid_overlay_h1__',
          points: [0, stepY, bW, stepY],
          stroke: '#9333ea',
          strokeWidth: 2,
          dashPattern: [4, 4],
          hittable: false,
        }))
        gridOverlayGroup.add(new Line({
          id: '__grid_overlay_h2__',
          points: [0, stepY * 2, bW, stepY * 2],
          stroke: '#9333ea',
          strokeWidth: 2,
          dashPattern: [4, 4],
          hittable: false,
        }))
      }
    } catch (e) {
      console.error('Grid overlay sync error:', e)
    }
  }, [canvasConfig])

  // Global keyboard shortcuts
  const handleKeyboardDelete = async (ids: string[]) => {
    if (ids.length === 0) return
    const nodeIds = ids.filter(Boolean)
    const selectionCount = nodeIds.length
    if (selectionCount === 0) return
    const confirmed = await feedback.confirm({
      title: tr('canvas.deleteConfirm', 'Delete selection?'),
      description: tr('canvas.deleteDesc', `This will remove ${selectionCount} selected item(s) permanently.`),
      confirmLabel: tr('common.delete', 'Delete'),
      cancelLabel: tr('common.cancel', 'Cancel'),
      tone: 'warning',
    })
    if (!confirmed) return
    if (nodeIds.length > 0) deleteNodes(nodeIds)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleGlobalKeyDown(e, {
        feedback,
        tr,
        appRef,
        nodeMapRef,
        handleKeyboardDelete,
      })
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Engine init & event binding
  useEffect(() => {
    if (!containerRef.current) return
    const app = new App({
      view: containerRef.current,
      editor: { rotateAround: 'center' },
      wheel: { zoomMode: true, zoomSpeed: 0.02 }
    })
    appRef.current = app
    // Force-clear any stale board from a previous App instance (React Strict Mode remount)
    boardRef.current = null
    ensureBoard(app)
    useEditorStore.getState().setLeaferApp(app)

    // Auto-fit artboard to viewport on first load & layout settle
    const autoFit = () => {
      useEditorStore.getState().zoomFit()
    }

    setTimeout(autoFit, 50)
    setTimeout(autoFit, 300)

    const ro = new ResizeObserver(() => {
      autoFit()
    })
    if (containerRef.current) ro.observe(containerRef.current)

    ;(window as any).__leaferZoomIn = () => useEditorStore.getState().zoomIn()
    ;(window as any).__leaferZoomOut = () => useEditorStore.getState().zoomOut()
    ;(window as any).__leaferZoomReset = () => useEditorStore.getState().zoomReset()
    ;(window as any).__leaferZoomFit = () => useEditorStore.getState().zoomFit()

    app.on(DragEvent.DRAG, (e) => {
      const guideGroup = ensureGuideGroup(app)
      handleNodeDragSnap(e.target, app, nodeMapRef.current, guideGroup)
    })

    app.on(DragEvent.START, (e) => {
      const originEvent = (e.origin as MouseEvent) || (window.event as MouseEvent)
      const target = e.target
      if (originEvent && originEvent.altKey && target && target.id && target.id !== '__scene_board__' && target.id !== '__guide_group__') {
        const state = useEditorStore.getState()
        const activeIds = state.activeIds
        const targetsToClone = activeIds.includes(target.id)
          ? state.elements.filter((el) => activeIds.includes(el.id))
          : state.elements.filter((el) => el.id === target.id)

        if (targetsToClone.length > 0) {
          const stayBehindCopies = targetsToClone.map((el) => ({
            ...JSON.parse(JSON.stringify(el)),
            id: `${el.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          }))
          stayBehindCopies.forEach((node) => state.addNode(node))
        }
      }
    })

    app.on(DragEvent.END, () => {
      if (guideGroupRef.current) {
        guideGroupRef.current.removeAll()
      }
      persistEditorSelection(app)
      setTimeout(() => {
        if ((app as any).editor?.list) {
          useEditorStore.getState().setActiveIds((app as any).editor.list.map((n: any) => n.id).filter(Boolean))
        }
      }, 0)
    })

    app.on(PointerEvent.UP, () => {
      const state = useEditorStore.getState()
      setTimeout(() => {
        const editorList = (app as any).editor?.list
        if (editorList) {
          let selectedIds = editorList.map((n: any) => n.id).filter(Boolean)
          const newSelection = new Set<string>(selectedIds)
          let expanded = false
          state.elements.forEach(el => {
             if (el.groupId && selectedIds.includes(el.id)) {
                 state.elements.filter(x => x.groupId === el.groupId).forEach(x => newSelection.add(x.id))
                 expanded = true
             }
          })
          const finalIds = Array.from(newSelection)
          state.setActiveIds(finalIds)
          if (expanded && appRef.current) {
              const globalNodes = finalIds.map(id => nodeMapRef.current.get(id)).filter(Boolean)
              if (globalNodes.length > 0) (appRef.current as any).editor.target = globalNodes
          }
        }
      }, 0)
    })

    app.on(PointerEvent.MENU, (e) => {
       (e.origin as MouseEvent).preventDefault()
       setMenuPos({ x: (e.origin as MouseEvent).clientX, y: (e.origin as MouseEvent).clientY })
     })
     app.on(PointerEvent.TAP, () => {
        setMenuPos(null)
     })

    return () => {
      ro.disconnect()
      boardRef.current = null
      app.destroy()
    }
  }, [])

  // Preview mode & editor visibility
  useEffect(() => {
    const app = appRef.current
    if (!app) return
    const toggleAnim = (node: any) => {
       const currentEl = useEditorStore.getState().elements.find((item) => item.id === node.id)
       const baseRotation = currentEl?.rotation ?? 0
       const baseOpacity = currentEl?.opacity ?? 1

       if (node.__animationRef) {
           try {
             if (isPreview) {
               node.__animationRef.play()
             } else {
               node.__animationRef.stop()
               try { node.__animationRef.destroy() } catch {}
               node.__animationRef = null
               node.rotation = baseRotation
               node.opacity = baseOpacity
               delete node.__initialRotation
               delete node.__initialOpacity
               delete (node as any).__animationType
             }
           } catch(e){}
       }
    }
    nodeMapRef.current.forEach(toggleAnim)
    elements.forEach((el) => {
      const node = nodeMapRef.current.get(el.id)
      if (node) {
        syncLeaferNode(node, el as any, runtimeOptions)
      }
    })
    if ((app as any).editor) {
       if (isPreview) {
           (app as any).editor.visible = false
       } else {
           (app as any).editor.visible = true
       }
    }
  }, [mode, isPreview, elements])

  // Selection sync
  useEffect(() => {
    const app = appRef.current as any
    if (!app?.editor || isPreview) return

    const selectedNodes = activeIds
      .map((id) => nodeMapRef.current.get(id))
      .filter(Boolean)

    const nextTarget = selectedNodes.length > 0 ? selectedNodes : null
    app.editor.target = nextTarget
  }, [activeIds, isPreview, elements])

  // Custom Ruler Guides sync
  const rulerGuides = useEditorStore((state) => state.rulerGuides)
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

  // Node sync
  useEffect(() => {
    if (!appRef.current) return
    const app = appRef.current
    const currentMap = nodeMapRef.current
    const newIds = new Set<string>()

    elements.forEach((el, index) => {
      newIds.add(el.id)
      const existingNode = currentMap.get(el.id)
      if (existingNode) {
        syncLeaferNode(existingNode, { ...el, zIndex: index }, runtimeOptions)
        if ((existingNode as any).__animationType !== el.animation?.type) {
          applyAnimation(existingNode, el.animation, useEditorStore.getState().isPreview, el.rotation ?? 0, el.opacity ?? 1)
          ;(existingNode as any).__animationType = el.animation?.type
        }
      } else {
        const node = createLeaferNode({ ...el, zIndex: index }, runtimeOptions)
        node.zIndex = index
        app.tree.add(node)
        currentMap.set(el.id, node)
        ;(node as any).__animationType = el.animation?.type
        applyAnimation(node, el.animation, useEditorStore.getState().isPreview, el.rotation ?? 0, el.opacity ?? 1)
      }
    })

    currentMap.forEach((node, id) => {
      if (!newIds.has(id)) { node.remove(); currentMap.delete(id) }
    })

    app.forceRender?.(undefined, true)
  }, [elements])

  const handleDragOver = (e: ReactDragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }
  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      const rect = containerRef.current?.getBoundingClientRect()
      const app = appRef.current
      if (rect && app) {
        const w = data.width || data.defaultProps?.width || 100
        const h = data.height || data.defaultProps?.height || 100

        // Convert screen coordinates to canvas logical coordinates
        // accounting for zoom and pan
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top

        let canvasX = screenX
        let canvasY = screenY

        // Use Leafer's coordinate system to get the logical position
        try {
          const tree = app.tree as any
          if (tree && typeof tree.getPagePoint === 'function') {
            // getPagePoint converts screen point to page/canvas point
            const point = tree.getPagePoint({ x: screenX, y: screenY })
            canvasX = point.x
            canvasY = point.y
          } else if (tree) {
            // Fallback: manually compute from tree's transform
            const zoom = tree.scaleX || tree.scale?.x || 1
            const tx = tree.x || 0
            const ty = tree.y || 0
            canvasX = (screenX - tx) / zoom
            canvasY = (screenY - ty) / zoom
          }
        } catch {}

        // Check if dropping image over an existing Image node to REPLACE it
        if ((data.type === 'Image' || data.url) && data.url) {
          const state = useEditorStore.getState()
          const targetImage = state.elements.slice().reverse().find(el => {
            if (el.type !== 'Image') return false
            const ex = el.x
            const ey = el.y
            const ew = el.width || 100
            const eh = el.height || 100
            return canvasX >= ex && canvasX <= ex + ew && canvasY >= ey && canvasY <= ey + eh
          })

          if (targetImage) {
            state.updateNode(targetImage.id, { url: data.url })
            feedback.notify({
              title: '图片替换成功',
              description: '已成功将新图片替换至已有图片图层',
              tone: 'success',
            })
            return
          }
        }

        useEditorStore.getState().addNode({
          ...(data.defaultProps || {}),
          ...data,
          id: `${(data.type || 'rect').toLowerCase()}-${Date.now()}`,
          x: Math.round((canvasX - w / 2) / 16) * 16,
          y: Math.round((canvasY - h / 2) / 16) * 16,
        })
      }
    } catch (e) {}
  }

  const lastMiddleClickRef = useRef<number>(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault()
      const now = Date.now()
      if (now - lastMiddleClickRef.current < 350) {
        useEditorStore.getState().zoomFit()
        lastMiddleClickRef.current = 0
      } else {
        lastMiddleClickRef.current = now
      }
    }
  }

  return (
    <div
      className="flex-1 w-full h-full bg-editor-deep overflow-hidden relative shadow-inner flex items-center justify-center"
    >
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-crosshair"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onAuxClick={(e) => e.button === 1 && e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
      />

      {menuPos && <CanvasContextMenu pos={menuPos} onClose={() => setMenuPos(null)} />}
    </div>
  )
}
