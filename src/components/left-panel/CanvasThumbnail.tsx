import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Leafer } from 'leafer-ui'
import '@leafer-in/view'
import type { CanvasConfig, EditorNode } from '@/store/useEditorStore'
import { bgColorToFill, createLeaferNode } from '@/core/leafer/runtime'
import { createBrandWatermark } from '@/core/branding'

export interface CanvasThumbnailSnapshot {
  canvasConfig: CanvasConfig
  elements: EditorNode[]
  previewDataUrl?: string | null
}

function getAspectRatio(canvasConfig: CanvasConfig): number {
  const width = canvasConfig.width || 800
  const height = canvasConfig.height || 1200
  return width / height
}

function getPosterStyle(aspectRatio: number): React.CSSProperties {
  const isPortrait = aspectRatio < 1
  return {
    aspectRatio: `${aspectRatio}`,
    width: isPortrait ? 'auto' : '100%',
    height: isPortrait ? '100%' : 'auto',
    maxWidth: '100%',
    maxHeight: '100%',
  }
}

/** Renders the same Leafer nodes as the editor, scaled into the sidebar slot. */
function LeaferThumbnailScene({ snapshot }: { snapshot: CanvasThumbnailSnapshot }) {
  const posterRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const leaferRef = useRef<Leafer | null>(null)
  const [posterSize, setPosterSize] = useState({ width: 0, height: 0 })

  const { width: canvasWidth, height: canvasHeight, bgColor } = snapshot.canvasConfig
  const scale = posterSize.width > 0 && posterSize.height > 0
    ? Math.min(posterSize.width / canvasWidth, posterSize.height / canvasHeight)
    : 0

  useLayoutEffect(() => {
    const poster = posterRef.current
    if (!poster) return

    const updateSize = () => {
      setPosterSize({ width: poster.clientWidth, height: poster.clientHeight })
    }
    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(poster)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const leafer = new Leafer({
      view: stage,
      width: canvasWidth,
      height: canvasHeight,
      fill: bgColorToFill(bgColor),
      pixelRatio: 1,
    })
    leaferRef.current = leafer

    const visibleElements = snapshot.elements.filter((element) => !element.hidden)
    visibleElements.forEach((element, index) => {
      try {
        const node = createLeaferNode(
          { ...element, zIndex: index },
          { editable: false, draggable: false },
        )
        node.zIndex = index
        leafer.add(node)
      } catch (error) {
        console.warn('[CanvasThumbnail] Failed to render element:', element.id, error)
      }
    })
    leafer.add(createBrandWatermark(canvasWidth, canvasHeight))

    leafer.forceRender?.(undefined, true)

    return () => {
      leaferRef.current = null
      try { leafer.destroy() } catch { /* ignore */ }
    }
  }, [bgColor, canvasHeight, canvasWidth, snapshot.elements])

  return (
    <div ref={posterRef} className="relative h-full w-full overflow-hidden">
      <div
        className="absolute left-0 top-0"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: scale > 0 ? `scale(${scale})` : 'scale(0)',
          transformOrigin: 'top left',
        }}
      >
        <div ref={stageRef} className="h-full w-full" />
      </div>
    </div>
  )
}

export function CanvasThumbnail({
  snapshot,
  emptyLabel,
}: {
  snapshot: CanvasThumbnailSnapshot | null
  emptyLabel: string
}) {
  if (!snapshot) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-md border border-dashed border-border bg-editor-deep text-[10px] text-editor-text-dim">
        {emptyLabel}
      </div>
    )
  }

  const aspectRatio = getAspectRatio(snapshot.canvasConfig)
  const posterStyle = getPosterStyle(aspectRatio)
  const hasContent = snapshot.elements.some((element) => !element.hidden)
  const frameStyle: React.CSSProperties = { height: '120px', width: '100%' }

  if (!hasContent) {
    return (
      <div
        style={frameStyle}
        className="flex items-center justify-center rounded-md border border-dashed border-border bg-editor-deep text-[10px] text-editor-text-dim"
      >
        <div
          style={posterStyle}
          className="flex items-center justify-center overflow-hidden rounded-[3px] border border-border bg-editor-deep px-2 text-center"
        >
          {emptyLabel}
        </div>
      </div>
    )
  }

  return (
    <div
      style={frameStyle}
      className="flex items-center justify-center overflow-hidden rounded-md border border-border bg-editor-deep/80"
    >
      <div
        style={posterStyle}
        className="relative shrink-0 overflow-hidden rounded-[3px] border border-border bg-editor-deep"
      >
        <LeaferThumbnailScene snapshot={snapshot} />
      </div>
    </div>
  )
}
