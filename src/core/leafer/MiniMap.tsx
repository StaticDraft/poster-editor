import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'

function normalizeColor(color: any, fallback: string) {
  if (!color) return fallback
  if (typeof color === 'string' && color.trim()) return color
  if (typeof color === 'object') {
    if (Array.isArray(color.stops) && color.stops.length > 0) {
      const first = color.stops[0]
      if (typeof first === 'string' && first.trim()) return first
    }
    if (color.type === 'image') return '#475569'
  }
  return fallback
}

export function MiniMap() {
  const { t } = useTranslation()
  const elements = useEditorStore((s) => s.elements)
  const canvasConfig = useEditorStore((s) => s.canvasConfig)
  const activeIds = useEditorStore((s) => s.activeIds)
  const app = useEditorStore((s) => s._leaferApp)
  const svgRef = useRef<SVGSVGElement>(null)

  const { width: posterW = 800, height: posterH = 1200, bgColor } = canvasConfig
  const visibleNodes = elements.filter((el) => !el.hidden)

  const [viewport, setViewport] = useState({
    viewX: 0,
    viewY: 0,
    viewW: posterW,
    viewH: posterH,
    zoomPercent: 100,
  })

  const [isDragging, setIsDragging] = useState(false)

  // Track Leafer viewport transform in real-time
  useEffect(() => {
    if (!app) return

    let frameId = 0
    const syncViewport = () => {
      const tree = (app as any)?.tree
      if (tree) {
        const zoomLayer = tree.zoomLayer || tree
        const scale = zoomLayer.scaleX || zoomLayer.__?.scaleX || 1
        const tx = zoomLayer.x || zoomLayer.__?.x || 0
        const ty = zoomLayer.y || zoomLayer.__?.y || 0
        const containerW = app.view?.clientWidth || app.width || 800
        const containerH = app.view?.clientHeight || app.height || 600

        const viewX = (0 - tx) / scale
        const viewY = (0 - ty) / scale
        const viewW = containerW / scale
        const viewH = containerH / scale
        const zoomPercent = Math.round(scale * 100)

        setViewport((prev) => {
          if (
            Math.abs(prev.viewX - viewX) < 1 &&
            Math.abs(prev.viewY - viewY) < 1 &&
            Math.abs(prev.viewW - viewW) < 1 &&
            Math.abs(prev.viewH - viewH) < 1 &&
            prev.zoomPercent === zoomPercent
          ) {
            return prev
          }
          return { viewX, viewY, viewW, viewH, zoomPercent }
        })
      }
      frameId = requestAnimationFrame(syncViewport)
    }

    syncViewport()
    return () => cancelAnimationFrame(frameId)
  }, [app])

  // Center main canvas to clicked/dragged position in Minimap
  const navigateToMapPoint = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!app || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Calculate aspect ratio scale and offsets inside SVG
    const svgRatio = rect.width / rect.height
    const posterRatio = posterW / posterH

    let renderW = rect.width
    let renderH = rect.height
    let renderX = 0
    let renderY = 0

    if (posterRatio > svgRatio) {
      renderH = rect.width / posterRatio
      renderY = (rect.height - renderH) / 2
    } else {
      renderW = rect.height * posterRatio
      renderX = (rect.width - renderW) / 2
    }

    const normX = Math.max(0, Math.min(1, (clickX - renderX) / renderW))
    const normY = Math.max(0, Math.min(1, (clickY - renderY) / renderH))

    const targetPosterX = normX * posterW
    const targetPosterY = normY * posterH

    const tree = (app as any)?.tree
    if (!tree) return
    const zoomLayer = tree.zoomLayer || tree
    const scale = zoomLayer.scaleX || zoomLayer.__?.scaleX || 1
    const containerW = app.view?.clientWidth || app.width || 800
    const containerH = app.view?.clientHeight || app.height || 600

    const nextTx = containerW / 2 - targetPosterX * scale
    const nextTy = containerH / 2 - targetPosterY * scale

    if (typeof zoomLayer.set === 'function') {
      zoomLayer.set({ x: nextTx, y: nextTy })
    } else {
      zoomLayer.x = nextTx
      zoomLayer.y = nextTy
    }
    app.forceRender?.()
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true)
    navigateToMapPoint(e)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      navigateToMapPoint(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="w-full h-36 bg-editor-deep border border-editor-darker rounded-lg overflow-hidden relative flex flex-col items-center justify-center p-2 shadow-inner select-none">
      <div className="w-full h-full relative flex items-center justify-center overflow-hidden rounded bg-black/50 border border-border/30">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${posterW} ${posterH}`}
          className="w-full h-full cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Poster background canvas */}
          <rect
            x={0}
            y={0}
            width={posterW}
            height={posterH}
            fill={normalizeColor(bgColor, '#1e293b')}
            rx={4}
          />

          {/* Render poster elements */}
          {visibleNodes.map((el) => {
            const isSelected = activeIds.includes(el.id)
            const x = el.x || 0
            const y = el.y || 0
            const w = el.width || 100
            const h = el.height || 100
            const fill = normalizeColor(el.fill || el.props?.fill, 'rgba(148, 163, 184, 0.4)')
            const rx = el.type === 'Ellipse' ? w / 2 : 0

            return (
              <g key={el.id}>
                {el.type === 'Ellipse' ? (
                  <ellipse
                    cx={x + w / 2}
                    cy={y + h / 2}
                    rx={w / 2}
                    ry={h / 2}
                    fill={fill}
                    stroke={isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'}
                    strokeWidth={isSelected ? Math.max(6, Math.min(posterW, posterH) * 0.008) : 2}
                  />
                ) : (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={rx}
                    fill={fill}
                    stroke={isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'}
                    strokeWidth={isSelected ? Math.max(6, Math.min(posterW, posterH) * 0.008) : 2}
                  />
                )}
              </g>
            )
          })}

          {/* Real-time Viewport Highlight Rectangle */}
          <rect
            x={viewport.viewX}
            y={viewport.viewY}
            width={viewport.viewW}
            height={viewport.viewH}
            fill="rgba(59, 130, 246, 0.18)"
            stroke="#3b82f6"
            strokeWidth={Math.max(4, Math.min(posterW, posterH) * 0.006)}
            strokeDasharray="12 6"
            rx={4}
            className="transition-all duration-75"
          />
        </svg>
      </div>

      <div className="absolute bottom-1 right-2 flex items-center gap-1.5 text-[9px] font-mono text-editor-text-dim font-bold bg-editor-deep/90 px-1.5 py-0.5 rounded border border-editor-darker pointer-events-none">
        <span className="text-blue-400">{viewport.zoomPercent}%</span>
        <span>{t('sidebar.nav.minimap', 'MINIMAP')}</span>
      </div>
    </div>
  )
}
