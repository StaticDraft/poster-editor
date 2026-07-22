import { useState } from 'react'
import { Download, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

interface ExportModalProps {
  open: boolean
  onClose: () => void
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
    const app = useEditorStore.getState()._leaferApp
    if (!app) return
    setIsExporting(true)
    try {
      const board = app.tree.findId('__scene_board__')
      const targetNode = board || app.tree
      const fileName = `${projectName || 'my_poster'}.${format}`

      // Request format-only export to get data payload
      const result = await targetNode.export(format, {
        scale,
        quality: format === 'png' ? undefined : quality,
      })

      if (result && result.data) {
        let downloadUrl = ''
        if (result.data instanceof Blob) {
          downloadUrl = URL.createObjectURL(result.data)
        } else if (typeof result.data === 'string') {
          downloadUrl = result.data
        } else if (result.data.url) {
          downloadUrl = result.data.url
        }

        if (downloadUrl) {
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          if (result.data instanceof Blob) {
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
          }
        }
      }

      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      })

      feedback.notify({
        title: '海报导出成功',
        description: `已成功导出并下载 ${scale}x 超清 ${format.toUpperCase()} 图片`,
        tone: 'success',
      })
      onClose()
    } catch (err) {
      console.error(err)
      feedback.notify({
        title: '导出图片失败',
        tone: 'error',
      })
    } finally {
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
