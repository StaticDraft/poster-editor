import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { App, PointerEvent, DragEvent, Rect, Group, Line } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/animate'
import '@leafer-in/view'
import '@leafer-in/viewport'
import '@leafer-in/scroll'
import { useEditorStore } from '@/store/useEditorStore'
import { CanvasContextMenu } from './CanvasContextMenu'
import { MiniMap } from './MiniMap'
import { applyAnimation, createLeaferNode, syncLeaferNode } from './runtime'
import { useFeedback } from '@/lib/feedback'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'

export function LeaferCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<App | null>(null)
  const boardRef = useRef<any>(null)
  const [menuPos, setMenuPos] = useState<{x: number, y: number} | null>(null)
  const nodeMapRef = useRef(new Map<string, any>())
  const guideGroupRef = useRef<Group | null>(null)

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

  const handleKeyboardCopy = () => {
    const state = useEditorStore.getState()
    const selectedNodes = state.elements.filter((item) => state.activeIds.includes(item.id))
    if (selectedNodes.length === 0) {
      feedback.notify({
        title: tr('canvas.copyEmpty', 'Nothing to copy'),
        description: tr('canvas.copyEmptyDesc', 'Select at least one node before copying.'),
        tone: 'warning',
      })
      return
    }
    state.copy()
  }

  const handleKeyboardPaste = () => {
    const state = useEditorStore.getState()
    if (state.clipboard.length === 0) {
      feedback.notify({
        title: tr('canvas.pasteEmpty', 'Clipboard is empty'),
        description: tr('canvas.pasteEmptyDesc', 'Copy nodes before pasting.'),
        tone: 'warning',
      })
      return
    }
    state.paste()
  }

  const getNodeGeometryUpdates = (node: any): { id: string; attrs: Partial<any> } | null => {
    if (!node?.id || node.id === '__scene_board__' || node.id === '__guide_group__') return null

    const current = useEditorStore.getState().elements.find((item) => item.id === node.id)
    if (!current) return null

    const next = {
      x: Math.round(Number(node.x ?? current.x) * 100) / 100,
      y: Math.round(Number(node.y ?? current.y) * 100) / 100,
      width: Math.round(Number(node.width ?? current.width ?? 0) * 100) / 100 || current.width,
      height: Math.round(Number(node.height ?? current.height ?? 0) * 100) / 100 || current.height,
      rotation: Math.round(Number(node.rotation ?? current.rotation ?? 0) * 100) / 100,
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
        stroke: 'rgba(148, 163, 184, 0.32)',
        strokeWidth: 1,
        editable: false,
        draggable: false,
        hittable: false,
        zIndex: -100000,
        shadow: {
          x: 0,
          y: 12,
          blur: 36,
          color: 'rgba(15, 23, 42, 0.35)',
        },
      })
      app.tree.add(boardRef.current)
    }

    return boardRef.current
  }

  const ensureGuideGroup = (app: App) => {
    if (guideGroupRef.current && guideGroupRef.current.destroyed) guideGroupRef.current = null
    if (!guideGroupRef.current) {
      guideGroupRef.current = new Group({ id: '__guide_group__', zIndex: 100000 })
      app.tree.add(guideGroupRef.current)
    }
    return guideGroupRef.current
  }

  // Bind canvas config changes to Leafer
  useEffect(() => {
    const app = appRef.current as any
    if (!app || app.destroyed) return
    try {
      const board = ensureBoard(app)
      board.set({
        width: canvasConfig.width,
        height: canvasConfig.height,
        fill: bgColorToFill(canvasConfig.bgColor),
        zIndex: -100000,
      })
    } catch (e) {
      console.error('Board background sync error:', e)
    }
    try {
      if (app.interaction) {
         if (app.interaction.config.move) app.interaction.config.move.disabled = canvasConfig.lockPan
         else app.interaction.config.move = { disabled: canvasConfig.lockPan }

         if (canvasConfig.lockPan && app.interaction.config.wheel) app.interaction.config.wheel.moveSpeed = 0
         else if (app.interaction.config.wheel) app.interaction.config.wheel.moveSpeed = 0.5
      }
    } catch {}
    try {
      if (app.interaction) {
         if (app.interaction.config.zoom) app.interaction.config.zoom.disabled = canvasConfig.lockZoom
         else app.interaction.config.zoom = { disabled: canvasConfig.lockZoom }

         if (app.interaction.config.wheel) {
             app.interaction.config.wheel.zoomMode = !canvasConfig.lockZoom
             app.interaction.config.wheel.zoomSpeed = canvasConfig.lockZoom ? 0 : 0.5
         }
      }
    } catch {}
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); useEditorStore.getState().undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); useEditorStore.getState().redo() }
      const activeElement = document.activeElement
      const editingField =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !editingField) {
        e.preventDefault()
        handleKeyboardCopy()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && !editingField) {
        e.preventDefault()
        handleKeyboardPaste()
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !editingField) {
        const actives = useEditorStore.getState().activeIds
        if (actives.length > 0) { e.preventDefault(); void handleKeyboardDelete(actives) }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        useEditorStore.getState().saveScene()
        const state = useEditorStore.getState()
        markSaved(buildEditorSaveFingerprint({
          currentSceneId: state.currentSceneId,
          projectName: state.projectName,
          projectCategory: state.projectCategory,
          canvasConfig: state.canvasConfig,
          elements: state.elements,
        }))
        feedback.notify({
          title: tr('canvasConfig.saved', 'Scene saved'),
          tone: 'success',
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Engine init & event binding
  useEffect(() => {
    if (!containerRef.current) return
    const app = new App({
      view: containerRef.current,
      editor: {},
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
      const target = e.target
      if (target && target.id && target.id !== '__scene_board__' && target.id !== '__guide_group__') {
        const guideGroup = ensureGuideGroup(app)
        guideGroup.removeAll()

        const draggingId = target.id
        const otherNodes: any[] = []
        nodeMapRef.current.forEach((node, id) => {
          if (id !== draggingId && node.parent && id !== '__scene_board__' && id !== '__guide_group__') {
            otherNodes.push(node)
          }
        })

        // Also snap to canvas center lines
        const { width: bWidth, height: bHeight } = useEditorStore.getState().canvasConfig
        otherNodes.push({
          x: bWidth / 2,
          y: bHeight / 2,
          width: 0,
          height: 0,
          id: '__board_center__'
        } as any)

        if (otherNodes.length === 0) return

        const threshold = 6
        let targetX = target.x
        let targetY = target.y

        const dragX_L = target.x
        const dragX_C = target.x + (target.width || 0) / 2
        const dragX_R = target.x + (target.width || 0)

        const dragY_T = target.y
        const dragY_M = target.y + (target.height || 0) / 2
        const dragY_B = target.y + (target.height || 0)

        let minDiffX = Infinity
        let alignedOtherX: any = null
        let matchDragX = 0
        let matchOtherX = 0

        for (const other of otherNodes) {
          const otherX_L = other.x
          const otherX_C = other.x + (other.width || 0) / 2
          const otherX_R = other.x + (other.width || 0)

          const dragPoints = [
            { val: dragX_L, ref: 'L' },
            { val: dragX_C, ref: 'C' },
            { val: dragX_R, ref: 'R' }
          ]
          const otherPoints = [
            { val: otherX_L, ref: 'L' },
            { val: otherX_C, ref: 'C' },
            { val: otherX_R, ref: 'R' }
          ]

          for (const dp of dragPoints) {
            for (const op of otherPoints) {
              const diff = Math.abs(dp.val - op.val)
              if (diff < threshold && diff < minDiffX) {
                minDiffX = diff
                alignedOtherX = other
                matchDragX = dp.val
                matchOtherX = op.val
              }
            }
          }
        }

        if (alignedOtherX) {
          if (matchDragX === dragX_L) {
            targetX = matchOtherX
          } else if (matchDragX === dragX_C) {
            targetX = matchOtherX - (target.width || 0) / 2
          } else {
            targetX = matchOtherX - (target.width || 0)
          }
        }

        let minDiffY = Infinity
        let alignedOtherY: any = null
        let matchDragY = 0
        let matchOtherY = 0

        for (const other of otherNodes) {
          const otherY_T = other.y
          const otherY_M = other.y + (other.height || 0) / 2
          const otherY_B = other.y + (other.height || 0)

          const dragPoints = [
            { val: dragY_T, ref: 'T' },
            { val: dragY_M, ref: 'M' },
            { val: dragY_B, ref: 'B' }
          ]
          const otherPoints = [
            { val: otherY_T, ref: 'T' },
            { val: otherY_M, ref: 'M' },
            { val: otherY_B, ref: 'B' }
          ]

          for (const dp of dragPoints) {
            for (const op of otherPoints) {
              const diff = Math.abs(dp.val - op.val)
              if (diff < threshold && diff < minDiffY) {
                minDiffY = diff
                alignedOtherY = other
                matchDragY = dp.val
                matchOtherY = op.val
              }
            }
          }
        }

        if (alignedOtherY) {
          if (matchDragY === dragY_T) {
            targetY = matchOtherY
          } else if (matchDragY === dragY_M) {
            targetY = matchOtherY - (target.height || 0) / 2
          } else {
            targetY = matchOtherY - (target.height || 0)
          }
        }

        const editorList = ((app as any).editor?.list || []) as any[]
        const diffX = targetX - target.x
        const diffY = targetY - target.y

        if (editorList.length > 1 && (diffX !== 0 || diffY !== 0)) {
          editorList.forEach((n: any) => {
            if (n && typeof n.set === 'function') {
              n.set({ x: (n.x || 0) + diffX, y: (n.y || 0) + diffY })
            }
          })
        } else {
          target.set({ x: targetX, y: targetY })
        }

        if (alignedOtherX) {
          const minY = Math.min(targetY, alignedOtherX.y)
          const maxY = Math.max(targetY + (target.height || 0), alignedOtherX.y + (alignedOtherX.height || 0))
          guideGroup.add(new Line({
            points: [matchOtherX, minY - 100, matchOtherX, maxY + 100],
            stroke: '#ef4444',
            strokeWidth: 1,
            dashPattern: [4, 4],
            hittable: false
          }))
        }

        if (alignedOtherY) {
          const minX = Math.min(targetX, alignedOtherX ? alignedOtherX.x : alignedOtherY.x)
          const maxX = Math.max(targetX + (target.width || 0), alignedOtherX ? (alignedOtherX.x + (alignedOtherX.width || 0)) : (alignedOtherY.x + (alignedOtherY.width || 0)))
          guideGroup.add(new Line({
            points: [minX - 100, matchOtherY, maxX + 100, matchOtherY],
            stroke: '#ef4444',
            strokeWidth: 1,
            dashPattern: [4, 4],
            hittable: false
          }))
        }

        if (app.editor) {
          app.editor.updateEditBox()
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
    const toggleAnim = (el: any) => {
       if (el.__animationRef) {
           try { isPreview ? el.__animationRef.play() : el.__animationRef.pause() } catch(e){}
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
          applyAnimation(existingNode, el.animation, useEditorStore.getState().isPreview)
          ;(existingNode as any).__animationType = el.animation?.type
        }
      } else {
        const node = createLeaferNode({ ...el, zIndex: index }, runtimeOptions)
        node.zIndex = index
        app.tree.add(node)
        currentMap.set(el.id, node)
        ;(node as any).__animationType = el.animation?.type
        applyAnimation(node, el.animation, useEditorStore.getState().isPreview)
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
        feedback.notify({
          title: '画布已自适应居中显示',
          tone: 'info',
        })
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

      {!isPreview && <MiniMap />}
    </div>
  )
}
