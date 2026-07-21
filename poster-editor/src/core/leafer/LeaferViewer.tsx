import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Leafer } from 'leafer-ui'
import '@leafer-in/animate'
import '@leafer-in/view'
import '@leafer-in/viewport'
import '@leafer-in/scroll'
import { useEditorStore, type CanvasConfig, type EditorNode } from '@/store/useEditorStore'
import { applyAnimation, createLeaferNode, syncLeaferNode } from './runtime'

interface LeaferViewerProps {
  elements?: EditorNode[]
  canvasConfig?: CanvasConfig
  onRuntimeAction?: (node: EditorNode & Record<string, any>) => void
}

function resolveSceneLayer(leafer: any) {
  return leafer?.zoomLayer || leafer
}

export function LeaferViewer({ elements: inputElements, canvasConfig: inputCanvasConfig, onRuntimeAction }: LeaferViewerProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leaferRef = useRef<Leafer | null>(null)
  const engineVersionRef = useRef(0)
  const nodeMapRef = useRef(new Map<string, any>())
  const runtimeActionRef = useRef<typeof onRuntimeAction>(onRuntimeAction)

  const storeElements = useEditorStore((state) => state.elements)
  const storeCanvasConfig = useEditorStore((state) => state.canvasConfig)

  const elements = inputElements || storeElements
  const canvasConfig = inputCanvasConfig || storeCanvasConfig

  const runtimeOptions = { editable: false, draggable: false }

  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    runtimeActionRef.current = onRuntimeAction
  }, [onRuntimeAction])

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scale = useMemo(() => {
    const { width, height, scaleMode } = canvasConfig
    if (scaleMode === 'fit-w') return windowSize.w / width
    if (scaleMode === 'fit-h') return windowSize.h / height
    const s = Math.min(windowSize.w / width, windowSize.h / height)
    return isNaN(s) ? 1 : s
  }, [windowSize, canvasConfig])

  const runWhenTreeReady = useCallback((fn: (scene: any, leafer: any) => void) => {
    const leafer = leaferRef.current as any
    if (!leafer) return
    const version = engineVersionRef.current
    const run = () => {
      if (engineVersionRef.current !== version) return
      if (leaferRef.current !== leafer) return
      if (leafer.destroyed) return
      fn(resolveSceneLayer(leafer), leafer)
    }

    if (leafer.viewReady) run()
    else leafer.waitViewReady(run)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    engineVersionRef.current += 1

    nodeMapRef.current.forEach((node) => {
      try { node.remove?.() } catch {}
    })
    nodeMapRef.current.clear()

    const leafer = new Leafer({
      view: containerRef.current,
      type: 'design',
      width: canvasConfig.width,
      height: canvasConfig.height,
      fill: canvasConfig.bgColor,
      wheel: { zoomMode: false },
    })
    leaferRef.current = leafer

    if ((leafer as any).interaction) {
      const config = (leafer as any).interaction.config
      if (config.move) config.move.disabled = true
      else config.move = { disabled: true }

      if (config.zoom) config.zoom.disabled = true
      else config.zoom = { disabled: true }

      if (config.wheel) config.wheel.disabled = true
    }

    leafer.waitViewReady(() => {
      try {
        leafer.set({ x: 0, y: 0, scale: 1, mode: 'preview' })
      } catch {}
    })

    return () => {
      nodeMapRef.current.forEach((node) => {
        try { node.remove?.() } catch {}
      })
      nodeMapRef.current.clear()
      leafer.destroy()
    }
  }, [])

  useEffect(() => {
    const leafer = leaferRef.current as any
    if (!leafer) return
    try {
      leafer.set({
        width: canvasConfig.width,
        height: canvasConfig.height,
        fill: canvasConfig.bgColor,
      })
    } catch {}
  }, [canvasConfig.width, canvasConfig.height, canvasConfig.bgColor])

  useEffect(() => {
    if (!leaferRef.current) return
    runWhenTreeReady((scene, leafer) => {
      const currentMap = nodeMapRef.current
      const newIds = new Set<string>()

      elements.forEach((el, index) => {
        newIds.add(el.id)
        const existingNode = currentMap.get(el.id)
        if (existingNode) {
          if (existingNode.parent !== scene) {
            try { existingNode.remove?.() } catch {}
            scene.add(existingNode)
          }
          syncLeaferNode(existingNode, { ...el, zIndex: index }, runtimeOptions)
          existingNode.zIndex = index
          if ((existingNode as any).__animationType !== el.animation?.type) {
            applyAnimation(existingNode, el.animation, true)
            ;(existingNode as any).__animationType = el.animation?.type
          }
        } else {
          const node = createLeaferNode({ ...el, zIndex: index }, runtimeOptions)
          node.zIndex = index
          scene.add(node)
          currentMap.set(el.id, node)
          ;(node as any).__animationType = el.animation?.type
          applyAnimation(node, el.animation, true)
        }
      })

      currentMap.forEach((node, id) => {
        if (!newIds.has(id)) {
          node.remove()
          currentMap.delete(id)
        }
      })

      leafer.forceRender?.(undefined, true)
    })
  }, [elements, runWhenTreeReady])

  return (
    <div className="flex-1 w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <div
        className="relative origin-center transition-transform duration-200"
        style={{
          width: canvasConfig.width,
          height: canvasConfig.height,
          backgroundColor: canvasConfig.bgColor,
          transform: `scale(${scale})`,
        }}
      >
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  )
}
