import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Image as ImageIcon, Video, X, Sparkles, FileImage } from 'lucide-react'
import { Leafer } from 'leafer-ui'
import '@leafer-in/export'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { bgColorToFill, createLeaferNode, applyAnimation } from '@/core/leafer/runtime'
import { resolveExportDataUrl } from '@/core/export/ExportResultAdapter'
import { saveFileNativeOrBrowser } from '@/lib/fileSave'
import { createAnimatedGifBlob } from '@/lib/gifEncoder'
import { createExportWatermark } from '@/core/branding'

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const { t } = useTranslation()
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp' | 'webm' | 'gif'>('png')
  const [scale, setScale] = useState<number>(2)
  const [quality, setQuality] = useState<number>(0.92)
  const [isExporting, setIsExporting] = useState(false)
  const [recordProgress, setRecordProgress] = useState(0)
  const feedback = useFeedback()

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  if (!open) return null

  const handleExport = async () => {
    setIsExporting(true)
    setRecordProgress(0)

    const { elements, canvasConfig, projectName } = useEditorStore.getState()
    const { width: posterW, height: posterH, bgColor } = canvasConfig
    const exportBounds = { x: 0, y: 0, width: posterW, height: posterH }

    const fileName = `${projectName || 'my_poster'}.${format}`
    const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webm' ? 'video/webm' : format === 'gif' ? 'image/gif' : `image/${format}`
    const exportQuality = format === 'png' ? undefined : quality
    let dataUrl = ''

    // Optimize GIF scale (max 480px width) so file size is < 1MB for WeChat chat bubble auto-play
    const exportScale = format === 'gif' ? Math.min(1, Math.round((480 / posterW) * 100) / 100) || 0.5 : scale

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
        pixelRatio: exportScale,
      })

      // Add all poster elements into offscreen Leafer and trigger autoplay animations
      elements.forEach((el, index) => {
        try {
          const node = createLeaferNode({ ...el, zIndex: index }, { editable: false, draggable: false })
          node.zIndex = index
          offscreenLeafer?.add(node)

          if (el.animation && el.animation.type && el.animation.type !== 'none') {
            applyAnimation(node, el.animation, true)
          }
        } catch (_err) {
          console.warn('Failed to add node to offscreen Leafer:', el, _err)
        }
      })
      offscreenLeafer.add(createExportWatermark(posterW, posterH))

      // Wait for offscreen Leafer view to be ready & images loaded
      await new Promise((resolve) => {
        if (!offscreenLeafer) return resolve(null)
        if ((offscreenLeafer as any).viewReady) {
          setTimeout(resolve, 80)
        } else {
          offscreenLeafer.waitViewReady(() => setTimeout(resolve, 80))
        }
      })

      if (format === 'webm') {
        // Animated WebM Video Recording Mode (3 seconds clip at 30fps)
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas && typeof (canvas as any).captureStream === 'function' && typeof MediaRecorder !== 'undefined') {
          const stream = (canvas as any).captureStream(30)
          const supportedMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm'
          const recorder = new MediaRecorder(stream, { mimeType: supportedMime })
          const chunks: Blob[] = []

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunks.push(e.data)
            }
          }

          const durationMs = 3000
          const intervalMs = 100
          let elapsed = 0

          recorder.start(100)

          await new Promise<void>((resolve) => {
            const timer = setInterval(() => {
              elapsed += intervalMs
              setRecordProgress(Math.min(99, Math.round((elapsed / durationMs) * 100)))
              if (elapsed >= durationMs) {
                clearInterval(timer)
                recorder.onstop = () => {
                  const videoBlob = new Blob(chunks, { type: 'video/webm' })
                  dataUrl = URL.createObjectURL(videoBlob)
                  resolve()
                }
                recorder.stop()
              }
            }, intervalMs)
          })
        } else {
          const exportResult = await offscreenLeafer.export(fileName, {
            scale,
            screenshot: exportBounds,
          })
          dataUrl = resolveExportDataUrl(exportResult, 'image/png', 0.95)
        }
      } else if (format === 'gif') {
        // Animated GIF Image Mode (15 frames over 1.8 seconds)
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas) {
          const ctx = canvas.getContext('2d')
          const frames: ImageData[] = []
          const frameCount = 15
          const frameDelay = 120

          // Allow offscreen animation ticks to warm up
          await new Promise((r) => setTimeout(r, 120))

          for (let i = 0; i < frameCount; i++) {
            setRecordProgress(Math.round(((i + 1) / frameCount) * 100))
            if (ctx) {
              const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              frames.push(frameData)
            }
            await new Promise((r) => setTimeout(r, frameDelay))
          }

          if (frames.length > 0) {
            const gifBlob = createAnimatedGifBlob(frames, canvas.width, canvas.height, frameDelay)
            dataUrl = URL.createObjectURL(gifBlob)
          }
        }
      } else {
        // Pure Offscreen Image Export
        const exportResult = await offscreenLeafer.export(fileName, {
          scale,
          quality: format === 'png' ? undefined : quality,
          screenshot: exportBounds,
        })
        dataUrl = resolveExportDataUrl(exportResult, mimeType, exportQuality)
      }
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
        await saveFileNativeOrBrowser({
          filename: fileName,
          data: dataUrl,
          mimeType: format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp',
          filters: [{ name: `${format.toUpperCase()} Image`, extensions: [format] }],
        })
      }

      try {
        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      } catch (_e) {}

      feedback.notify({
        title: tr('exportModal.exportSuccess', '海报导出成功'),
        description: t('exportModal.exportSuccessDesc', { scale, format: format.toUpperCase() }) || `已成功导出并下载 ${scale}x ${format.toUpperCase()} 文件`,
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
            {format === 'webm' ? (
              <Video className="w-4 h-4 text-purple-500" />
            ) : format === 'gif' ? (
              <FileImage className="w-4 h-4 text-amber-500" />
            ) : (
              <ImageIcon className="w-4 h-4 text-rose-500" />
            )}
            <span>{tr('exportModal.title', '导出海报图片与动画视频')}</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Format selection */}
          <div>
            <label className="block text-muted-foreground font-medium mb-1.5">{tr('exportModal.imageFormat', '导出格式')}</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['png', 'jpg', 'webp', 'webm', 'gif'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`py-2 text-[11px] font-bold rounded-lg border transition-colors uppercase ${
                    format === fmt
                      ? fmt === 'webm'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                        : fmt === 'gif'
                        ? 'bg-amber-500 border-amber-400 text-white shadow-md'
                        : 'bg-rose-500 border-rose-500 text-white shadow-md'
                      : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {fmt === 'webm' ? '🎬 WEBM' : fmt === 'gif' ? '✨ GIF' : fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Animated WebM / GIF hint badges */}
          {format === 'webm' && (
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                {tr(
                  'exportModal.webmHint',
                  '✨ WEBM 格式将自动录制 3 秒 30fps 高清动态短视频，完美兼容电子水牌与朋友圈动态卡片。',
                )}
              </span>
            </div>
          )}

          {format === 'gif' && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {tr(
                  'exportModal.gifHint',
                  '✨ GIF 格式将自动生成无缝循环的动态 GIF 动图，完美兼容微信公众号、小红书与网页贴图。',
                )}
              </span>
            </div>
          )}

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
          {format !== 'png' && format !== 'webm' && format !== 'gif' && (
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
          <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting} className="text-xs">
            {tr('exportModal.cancel', '取消')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className={`font-bold text-xs shadow-md ${
              format === 'webm'
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : format === 'gif'
                ? 'bg-amber-500 hover:bg-amber-400 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {isExporting
              ? format === 'webm'
                ? tr('exportModal.recording', `正在录制 3 秒动态视频 (${recordProgress}%)...`).replace('{{progress}}', String(recordProgress))
                : format === 'gif'
                ? tr('exportModal.recordingGif', `正在合成动态 GIF 动图 (${recordProgress}%)...`).replace('{{progress}}', String(recordProgress))
                : tr('exportModal.exporting', '生成导出中...')
              : tr('exportModal.downloadNow', '立即下载导出文件')}
          </Button>
        </div>
      </div>
    </div>
  )
}
