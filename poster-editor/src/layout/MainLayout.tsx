import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'

interface MainLayoutProps {
  leftPanel?: React.ReactNode | null
  centerCanvas?: React.ReactNode
  rightPanel?: React.ReactNode | null
  topToolbar?: React.ReactNode
}

const RULER_SIZE = 24

interface ViewportMetrics {
  scale: number
  offsetX: number
  offsetY: number
}

interface TickItem {
  key: string
  position: number
  value: number
  major: boolean
}

function getStableScale(value: number | undefined) {
  const scale = Math.abs(value || 1)
  return Number.isFinite(scale) && scale > 0 ? scale : 1
}

function getRulerStep(scale: number) {
  const targetPx = 80
  const targetValue = targetPx / getStableScale(scale)
  const power = 10 ** Math.floor(Math.log10(targetValue || 1))
  const candidates = [1, 2, 5, 10].map((item) => item * power)
  return candidates.find((item) => item >= targetValue) || power * 10
}

function formatRulerLabel(value: number) {
  if (Math.abs(value) >= 100 || Number.isInteger(value)) return String(Math.round(value))
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2).replace(/\.?0+$/, '')
}

function createTicks(length: number, offset: number, scale: number) {
  const safeScale = getStableScale(scale)
  const majorStep = getRulerStep(safeScale)
  const minorStep = majorStep / 5
  const start = (-offset) / safeScale
  const end = (length - offset) / safeScale
  const startIndex = Math.floor(start / minorStep) - 1
  const endIndex = Math.ceil(end / minorStep) + 1
  const ticks: TickItem[] = []

  for (let index = startIndex; index <= endIndex; index += 1) {
    const value = Number((index * minorStep).toFixed(4))
    const position = offset + value * safeScale
    if (position < -2 || position > length + 2) continue
    const major = index % 5 === 0
    ticks.push({
      key: `${value}-${major ? 'major' : 'minor'}`,
      position,
      value,
      major,
    })
  }

  return ticks
}

export function MainLayout({ leftPanel, centerCanvas, rightPanel, topToolbar }: MainLayoutProps) {
  const viewportRef = useRef<HTMLElement>(null)
  const app = useEditorStore((state) => state._leaferApp)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [viewport, setViewport] = useState<ViewportMetrics>({ scale: 1, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    const updateSize = () => {
      setViewportSize({
        width: node.clientWidth,
        height: node.clientHeight,
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!app) {
      setViewport({ scale: 1, offsetX: 0, offsetY: 0 })
      return
    }

    let frameId = 0

    const syncViewport = () => {
      const tree = (app as any)?.tree
      const zoomLayer = tree?.zoomLayer || tree
      const nextViewport = {
        scale: getStableScale(zoomLayer?.scaleX ?? zoomLayer?.__?.scaleX),
        offsetX: Number(zoomLayer?.x ?? zoomLayer?.__?.x ?? 0),
        offsetY: Number(zoomLayer?.y ?? zoomLayer?.__?.y ?? 0),
      }

      setViewport((prev) => {
        const unchanged =
          Math.abs(prev.scale - nextViewport.scale) < 0.001 &&
          Math.abs(prev.offsetX - nextViewport.offsetX) < 0.5 &&
          Math.abs(prev.offsetY - nextViewport.offsetY) < 0.5
        return unchanged ? prev : nextViewport
      })

      frameId = window.requestAnimationFrame(syncViewport)
    }

    syncViewport()

    return () => window.cancelAnimationFrame(frameId)
  }, [app])

  const xTicks = useMemo(
    () => createTicks(viewportSize.width, viewport.offsetX, viewport.scale),
    [viewport.offsetX, viewport.scale, viewportSize.width],
  )

  const yTicks = useMemo(
    () => createTicks(viewportSize.height, viewport.offsetY, viewport.scale),
    [viewport.offsetY, viewport.scale, viewportSize.height],
  )

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-editor text-foreground">
      {/* Toolbar */}
      <header className="h-11 border-b border-editor-darker flex items-center bg-editor shrink-0">
        {topToolbar}
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        {leftPanel && (
          <aside className="flex shrink-0 border-r border-editor-darker">
            {leftPanel}
          </aside>
        )}

        {/* Canvas + Ruler wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* X-axis ruler */}
          <div className="bg-ruler border-b border-editor-darker flex items-center overflow-hidden shrink-0 relative select-none" style={{ height: RULER_SIZE }}>
            <div className="absolute left-0 top-0 h-full bg-editor-deep border-r border-editor-darker" style={{ width: RULER_SIZE }} />
            <div className="absolute inset-y-0 right-0 overflow-hidden" style={{ left: RULER_SIZE }}>
              {xTicks.map((tick) => (
                <div
                  key={tick.key}
                  className="absolute bottom-0"
                  style={{ left: tick.position }}
                >
                  <div className={`w-px ${tick.major ? 'h-3 bg-slate-400/80' : 'h-1.5 bg-slate-500/60'}`} />
                  {tick.major && (
                    <span className="absolute left-1 top-0 text-[8px] text-editor-text-dim leading-none whitespace-nowrap">
                      {formatRulerLabel(tick.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Y-axis ruler + canvas */}
          <div className="flex flex-1 overflow-hidden">
            {/* Y-axis ruler */}
            <div className="bg-ruler border-r border-editor-darker flex flex-col items-center overflow-hidden shrink-0 relative select-none" style={{ width: RULER_SIZE }}>
              {yTicks.map((tick) => (
                <div
                  key={tick.key}
                  className="absolute right-0 flex items-start justify-end w-full"
                  style={{ top: tick.position }}
                >
                  <div className={`h-px ${tick.major ? 'w-3 bg-slate-400/80' : 'w-1.5 bg-slate-500/60'}`} />
                  {tick.major && (
                    <span
                      className="text-[8px] text-editor-text-dim absolute leading-none"
                      style={{ writingMode: 'vertical-rl', left: 2, top: 1 }}
                    >
                      {formatRulerLabel(tick.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Center Canvas */}
            <section ref={viewportRef} className="flex-1 relative overflow-hidden">
              {centerCanvas}
            </section>
          </div>
        </div>

        {/* Right Config Panel */}
        {rightPanel && (
          <aside className="w-72 border-l border-editor-darker bg-editor flex flex-col overflow-y-auto shrink-0">
            {rightPanel}
          </aside>
        )}
      </main>
    </div>
  )
}
