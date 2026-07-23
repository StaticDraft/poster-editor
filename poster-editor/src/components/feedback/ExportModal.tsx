import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Image as ImageIcon, X } from 'lucide-react'
import { Leafer } from 'leafer-ui'
import '@leafer-in/export'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { bgColorToFill, createLeaferNode } from '@/core/leafer/runtime'

import { resolveExportDataUrl } from '@/core/export/ExportResultAdapter'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { t } = useTranslation()
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png')
  const [scale, setScale] = useState<number>(2)
  const [quality, setQuality] = useState<number>(0.92)
  const [isExporting, setIsExporting] = useState(false)
  const feedback = useFeedback()

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  if (!open) return null

  const handleExport = async () => {
    setIsExporting(true)
    const { elements, canvasConfig, projectName } = useEditorStore.getState()
    const { width: posterW, height: posterH, bgColor } = canvasConfig

    const fileName = `${projectName || 'my_poster'}.${format}`
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
    const exportQuality = format === 'png' ? undefined : quality
    let dataUrl = ''

    // 1. Offscreen Isolated Container Creation
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-99999px'
    container.style.top = '-99999px'
    container.style.width = `${posterW}px`
    container.style.height = `${posterH}px`
    container.style.overflow = 'hidden'
    container.style.zIndex = '-99999'
    document.body.appendChild(container)

    let offscreenLeafer: Leafer | null = null

    try {
      offscreenLeafer = new Leafer({
        view: container,
        width: posterW,
        height: posterH,
        fill: bgColorToFill(bgColor),
        pixelRatio: scale,
      })

      // Add all poster elements into offscreen Leafer
      elements.forEach((el, index) => {
        try {
          const node = createLeaferNode({ ...el, zIndex: index }, { editable: false, draggable: false })
          node.zIndex = index
          offscreenLeafer?.add(node)
        } catch (_err) {
          console.warn('Failed to add node to offscreen Leafer:', el, _err)
        }
      })

      // Wait for offscreen Leafer view to be ready & images loaded
      await new Promise((resolve) => {
        if (!offscreenLeafer) return resolve(null)
        if ((offscreenLeafer as any).viewReady) {
          setTimeout(resolve, 80)
        } else {
          offscreenLeafer.waitViewReady(() => setTimeout(resolve, 80))
        }
      })

      // Perform pure offscreen export
      const exportResult = await offscreenLeafer.export(fileName, {
        scale,
        quality: format === 'png' ? undefined : quality,
      })

      dataUrl = resolveExportDataUrl(exportResult, mimeType, exportQuality)
    } catch (err) {
      console.error('Offscreen export error:', err)
    } finally {
      if (offscreenLeafer) {
        try { offscreenLeafer.destroy() } catch (_e) {}
      }
      try { document.body.removeChild(container) } catch (_e) {}
    }

    if (dataUrl) {
      if (dataUrl !== 'saved') {
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        setTimeout(() => document.body.removeChild(link), 500)
      }

      try {
        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      } catch (_e) {}

      feedback.notify({
        title: tr('exportModal.exportSuccess', '海报导出成功'),
        description: t('exportModal.exportSuccessDesc', { scale, format: format.toUpperCase() }) || `已成功导出并下载 ${scale}x ${format.toUpperCase()} 图片`,
        tone: 'success',
      })
      onClose()
    } else {
      feedback.notify({ title: tr('exportModal.exportFailed', '导出失败：渲染生成错误'), tone: 'error' })
    }
    setIsExporting(false)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <span>{tr('exportModal.title', '导出海报图片')}</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block text-muted-foreground font-medium mb-1.5">{tr('exportModal.imageFormat', '图片格式')}</label>
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
            <label className="block text-muted-foreground font-medium mb-1.5">{tr('exportModal.resolution', '导出清晰度 (分辨率倍率)')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 1, labelKey: 'exportModal.scale1x', fallback: '标准 1x' },
                { val: 2, labelKey: 'exportModal.scale2x', fallback: '高清 2x (推荐)' },
                { val: 3, labelKey: 'exportModal.scale3x', fallback: '超清 3x (印刷)' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setScale(item.val)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${scale === item.val ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-muted/40 border-border text-foreground hover:bg-muted'}`}
                >
                  {tr(item.labelKey, item.fallback)}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider for JPG/WebP */}
          {format !== 'png' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-muted-foreground font-medium">{tr('exportModal.quality', '压缩质量')}</label>
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
            {tr('exportModal.cancel', '取消')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {isExporting ? tr('exportModal.exporting', '生成导出中...') : tr('exportModal.downloadNow', '立即下载图片')}
          </Button>
        </div>
      </div>
    </div>
  )
}
