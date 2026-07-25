import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Leafer } from 'leafer-ui'
import { Play, Pause, RotateCcw, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/useEditorStore'
import { bgColorToFill, createLeaferNode, applyAnimation } from '@/core/leafer/runtime'

export function PreviewModal() {
  const { t } = useTranslation()
  const isPreview = useEditorStore((state) => state.isPreview)
  const setIsPreview = useEditorStore((state) => state.setIsPreview)
  const elements = useEditorStore((state) => state.elements)
  const canvasConfig = useEditorStore((state) => state.canvasConfig)

  const [isPlaying, setIsPlaying] = useState(true)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Leafer | null>(null)
  const nodeMapRef = useRef<Map<string, any>>(new Map())

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  const { width: posterW, height: posterH, bgColor } = canvasConfig

  // Auto-fit preview poster into viewport
  const maxW = typeof window !== 'undefined' ? window.innerWidth * 0.8 : 800
  const maxH = typeof window !== 'undefined' ? window.innerHeight * 0.78 : 1000
  const scaleW = maxW / posterW
  const scaleH = maxH / posterH
  const fitScale = Math.min(1, Math.min(scaleW, scaleH))

  useEffect(() => {
    if (!isPreview || !previewContainerRef.current) return

    const container = previewContainerRef.current
    container.innerHTML = ''

    const app = new Leafer({
      view: container,
      width: posterW,
      height: posterH,
      fill: bgColorToFill(bgColor),
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2,
    })

    appRef.current = app
    const nodeMap = new Map<string, any>()

    // Clone and instantiate read-only isolated nodes for live animation preview
    elements.forEach((el, index) => {
      try {
        const node = createLeaferNode({ ...el, zIndex: index }, { editable: false, draggable: false })
        node.zIndex = index
        app.add(node)
        nodeMap.set(el.id, node)

        if (el.animation && el.animation.type && el.animation.type !== 'none') {
          applyAnimation(node, el.animation, true, el.rotation ?? 0, el.opacity ?? 1)
        }
      } catch (err) {
        console.warn('Failed to add preview node:', el, err)
      }
    })

    nodeMapRef.current = nodeMap
    setIsPlaying(true)

    return () => {
      nodeMap.clear()
      appRef.current = null
      app.destroy()
    }
  }, [isPreview, posterW, posterH, bgColor, elements])

  if (!isPreview) return null

  const handleTogglePlay = () => {
    const nextState = !isPlaying
    setIsPlaying(nextState)

    nodeMapRef.current.forEach((node) => {
      if (node.__animationRef) {
        try {
          if (nextState) {
            node.__animationRef.play()
          } else {
            node.__animationRef.pause()
          }
        } catch (_e) {}
      }
    })
  }

  const handleRestart = () => {
    setIsPlaying(true)
    nodeMapRef.current.forEach((node, id) => {
      const el = elements.find((item) => item.id === id)
      if (el && el.animation && el.animation.type && el.animation.type !== 'none') {
        applyAnimation(node, el.animation, true, el.rotation ?? 0, el.opacity ?? 1)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-between bg-slate-950/90 backdrop-blur-xl p-6 animate-in fade-in-0 select-none overflow-hidden">
      {/* Top Preview Control Header */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 py-2 bg-card/80 border border-border/80 backdrop-blur-md rounded-xl shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              {tr('preview.title', '海报动态效果沉浸预览')}
              <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-full">
                {posterW} × {posterH} px
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {tr('preview.subtitle', '独立渲染引擎运行中 · 物理隔离主编辑器工程')}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            className="h-8 gap-1.5 text-xs font-bold bg-card hover:bg-muted border-border"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {tr('preview.restart', '重新播放')}
          </Button>

          <Button
            size="sm"
            onClick={handleTogglePlay}
            className={`h-8 gap-1.5 text-xs font-bold text-white transition-all shadow-xs ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                {tr('preview.pause', '暂停动效')}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                {tr('preview.play', '继续播放')}
              </>
            )}
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsPreview(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center Theater Stage Container */}
      <div className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden">
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 transition-transform duration-300"
          style={{
            width: `${posterW * fitScale}px`,
            height: `${posterH * fitScale}px`,
          }}
        >
          <div
            ref={previewContainerRef}
            className="origin-top-left"
            style={{
              width: `${posterW}px`,
              height: `${posterH}px`,
              transform: `scale(${fitScale})`,
            }}
          />
        </div>
      </div>

      {/* Bottom Footer Hint */}
      <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 shrink-0">
        <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded text-foreground shadow-xs">
          ESC
        </kbd>
        {tr('preview.escHint', '或点击右上角关闭按钮退出演示模式')}
      </div>
    </div>
  )
}
