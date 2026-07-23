import { useState } from 'react'
import { Download, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

function parseExportDataUrl(exportResult: any, mimeType: string, quality?: number): string {
  if (!exportResult) return ''
  const item = exportResult.data !== undefined ? exportResult.data : exportResult

  if (typeof item === 'string') {
    return item
  }

  if (item instanceof Blob) {
    return URL.createObjectURL(item)
  }

  if (typeof HTMLCanvasElement !== 'undefined' && item instanceof HTMLCanvasElement) {
    return item.toDataURL(mimeType, quality)
  }

  if (item && typeof item.toDataURL === 'function') {
    return item.toDataURL(mimeType, quality)
  }

  if (item && item.view && typeof item.view.toDataURL === 'function') {
    return item.view.toDataURL(mimeType, quality)
  }

  if (item && item.canvas && typeof item.canvas.toDataURL === 'function') {
    return item.canvas.toDataURL(mimeType, quality)
  }

  if (exportResult?.url && typeof exportResult.url === 'string') {
    return exportResult.url
  }

  return ''
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png')
  const [scale, setScale] = useState<number>(2)
  const [quality, setQuality] = useState<number>(0.92)
  const [isExporting, setIsExporting] = useState(false)
  const feedback = useFeedback()
  const projectName = useEditorStore((state) => state.projectName)

  if (!open) return null

  const handleExport = async () => {
    const app = useEditorStore.getState()._leaferApp as any
    if (!app) return
    setIsExporting(true)

    const boardShadow = app.tree?.findId?.('__board_shadow__')
    const gridOverlay = app.tree?.findId?.('__grid_overlay_group__')
    const guideGroup = app.tree?.findId?.('__guide_group__')

    const tree = app.tree as any
    const savedX = tree?.x ?? 0
    const savedY = tree?.y ?? 0
    const savedScaleX = tree?.scaleX ?? (tree?.scale?.x || 1)
    const savedScaleY = tree?.scaleY ?? (tree?.scale?.y || 1)
    const editorVisible = app.editor?.visible

    // Temporarily hide editor-only overlays, viewport shadow, selection box, and reset viewport pan/zoom transform
    if (boardShadow) boardShadow.visible = false
    if (gridOverlay) gridOverlay.visible = false
    if (guideGroup) guideGroup.visible = false

    if (app.editor) {
      try {
        app.editor.visible = false
      } catch (_e) {}
    }

    try {
      if (typeof tree?.set === 'function') {
        tree.set({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
      } else if (tree) {
        tree.x = 0
        tree.y = 0
        tree.scaleX = 1
        tree.scaleY = 1
      }
    } catch (_e) {}

    try {
      const fileName = `${projectName || 'my_poster'}.${format}`
      const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
      const exportQuality = format === 'png' ? undefined : quality
      const { width: posterW, height: posterH } = useEditorStore.getState().canvasConfig
      const targetW = Math.round(posterW * scale)
      const targetH = Math.round(posterH * scale)

      let dataUrl = ''

      // Attempt 1: Leafer native export constrained to exact poster bounds (0, 0, posterW, posterH)
      const posterBounds = { x: 0, y: 0, width: posterW, height: posterH }

      if (app.tree && typeof app.tree.export === 'function') {
        try {
          const exportResult = await app.tree.export(format, {
            bounds: posterBounds,
            scale,
            quality: format === 'png' ? undefined : quality,
            blob: false,
            screenshot: false,
          })
          dataUrl = parseExportDataUrl(exportResult, mimeType, exportQuality)
        } catch (_e) {
          console.warn('Leafer export() failed, falling back to canvas crop:', _e)
        }
      }

      // Attempt 2: Precise DOM page-to-canvas coordinate crop from rendered viewport canvas
      if (!dataUrl && app.view) {
        const containerDiv = app.view
        const canvases = containerDiv.querySelectorAll('canvas')
        const boardNode = app.tree?.findId?.('__scene_board__')

        if (canvases.length > 0) {
          const boardBounds = boardNode ? boardNode.getBounds('page') : null

          const offscreen = document.createElement('canvas')
          offscreen.width = targetW
          offscreen.height = targetH
          const ctx = offscreen.getContext('2d')!

          const posterRatio = posterW / posterH

          canvases.forEach((c: HTMLCanvasElement) => {
            try {
              const canvasRect = c.getBoundingClientRect()
              let srcX = 0
              let srcY = 0
              let srcW = c.width
              let srcH = c.height

              if (boardBounds && canvasRect.width > 0 && canvasRect.height > 0) {
                const ratioX = c.width / canvasRect.width
                const ratioY = c.height / canvasRect.height

                srcX = Math.max(0, Math.round((boardBounds.x - canvasRect.left) * ratioX))
                srcY = Math.max(0, Math.round((boardBounds.y - canvasRect.top) * ratioY))
                srcW = Math.round(boardBounds.width * ratioX)
                srcH = Math.round(boardBounds.height * ratioY)
              }

              // Guarantee aspect ratio locking (posterW / posterH) to prevent image squishing/distortion
              if (srcW <= 0 || srcH <= 0 || Math.abs((srcW / srcH) - posterRatio) > 0.05) {
                srcH = c.height
                srcW = Math.round(srcH * posterRatio)
                if (srcW > c.width) {
                  srcW = c.width
                  srcH = Math.round(srcW / posterRatio)
                }
                srcX = Math.round((c.width - srcW) / 2)
                srcY = Math.round((c.height - srcH) / 2)
              }

              ctx.drawImage(c, srcX, srcY, srcW, srcH, 0, 0, targetW, targetH)
            } catch (_e) { /* skip tainted canvases */ }
          })

          dataUrl = offscreen.toDataURL(mimeType, exportQuality)
        }
      }

      // Trigger browser file download
      if (dataUrl) {
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        setTimeout(() => document.body.removeChild(link), 500)
      } else {
        feedback.notify({ title: '导出失败：未找到画布元素', tone: 'error' })
        setIsExporting(false)
        return
      }

      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      })

      feedback.notify({
        title: '海报导出成功',
        description: `已成功导出并下载 ${scale}x ${format.toUpperCase()} 图片`,
        tone: 'success',
      })
      onClose()
    } catch (err) {
      console.error('Export error:', err)
      feedback.notify({
        title: '导出图片失败',
        description: String(err),
        tone: 'error',
      })
    } finally {
      // Restore editor-only overlays and viewport shadow
      if (boardShadow) boardShadow.visible = true
      if (gridOverlay) gridOverlay.visible = true
      if (guideGroup) guideGroup.visible = true

      // Restore viewport pan & zoom transform
      try {
        if (typeof tree?.set === 'function') {
          tree.set({ x: savedX, y: savedY, scaleX: savedScaleX, scaleY: savedScaleY })
        } else if (tree) {
          tree.x = savedX
          tree.y = savedY
          tree.scaleX = savedScaleX
          tree.scaleY = savedScaleY
        }
      } catch (_e) {}

      // Restore selection handles
      if (app.editor && editorVisible !== undefined) {
        try {
          app.editor.visible = editorVisible
        } catch (_e) {}
      }

      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span>导出海报图片</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block text-muted-foreground font-medium mb-1.5">图片格式</label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors uppercase ${format === fmt ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 'bg-muted/40 border-border text-foreground hover:bg-muted'}`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Scale selection */}
          <div>
            <label className="block text-muted-foreground font-medium mb-1.5">导出清晰度 (分辨率倍率)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, label: '标准 1x' },
                { val: 2, label: '高清 2x (推荐)' },
                { val: 3, label: '超清 3x (印刷)' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setScale(item.val)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${scale === item.val ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-muted/40 border-border text-foreground hover:bg-muted'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider for JPG/WebP */}
          {format !== 'png' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-muted-foreground font-medium">压缩质量</label>
                <span className="font-mono text-foreground font-bold">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-muted rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            取消
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {isExporting ? '生成导出中...' : '立即下载图片'}
          </Button>
        </div>
      </div>
    </div>
  )
}
