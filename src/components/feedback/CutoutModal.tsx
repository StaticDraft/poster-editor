import { useState, useEffect, useRef, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useEditorStore } from '@/store/useEditorStore'
import { processProfessionalCutout, loadImageWithCorsFallback, type CutoutOptions } from '@/lib/imageProcess'
import { useFeedback } from '@/lib/feedback'
import { Wand2, Pipette, RefreshCw, Check, SlidersHorizontal } from 'lucide-react'

interface CutoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nodeId?: string
}

export function CutoutModal({ open, onOpenChange, nodeId }: CutoutModalProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const updateNode = useEditorStore((s) => s.updateNode)
  const elements = useEditorStore((s) => s.elements)

  const activeNode = elements.find((el) => el.id === nodeId) || elements.find((el) => el.type === 'Image')
  const originalUrl = activeNode?.props?.originalUrl || activeNode?.url || ''

  const [mode, setMode] = useState<CutoutOptions['mode']>('white')
  const [tolerance, setTolerance] = useState<number>(35)
  const [feather, setFeather] = useState<number>(1)
  const [invert, setInvert] = useState<boolean>(false)
  const [targetColor, setTargetColor] = useState<{ r: number; g: number; b: number }>({ r: 255, g: 255, b: 255 })
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false)

  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  // Draw original image on internal picking canvas
  useEffect(() => {
    if (!open || !originalUrl) return
    let isCancelled = false

    loadImageWithCorsFallback(originalUrl)
      .then((img) => {
        if (isCancelled || !canvasRef.current) return
        const cvs = canvasRef.current
        cvs.width = img.naturalWidth || img.width
        cvs.height = img.naturalHeight || img.height
        const ctx = cvs.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
        }
      })
      .catch((err) => console.error('Failed to render picker canvas', err))

    return () => {
      isCancelled = true
    }
  }, [open, originalUrl])

  // Process Cutout Preview with debouncing
  useEffect(() => {
    if (!open || !originalUrl) return
    let isCancelled = false
    setIsProcessing(true)

    const timer = setTimeout(() => {
      processProfessionalCutout(originalUrl, {
        mode,
        targetColor,
        tolerance,
        feather,
        invertSelection: invert,
      })
        .then((result) => {
          if (!isCancelled) {
            setPreviewUrl(result)
          }
        })
        .catch((err) => console.error('Cutout processing failed', err))
        .finally(() => {
          if (!isCancelled) setIsProcessing(false)
        })
    }, 180)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [open, originalUrl, mode, targetColor, tolerance, feather, invert])

  // Canvas Eyedropper click handler
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !canvasRef.current) return
    const cvs = canvasRef.current
    const rect = cvs.getBoundingClientRect()
    const scaleX = cvs.width / rect.width
    const scaleY = cvs.height / rect.height

    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)

    const ctx = cvs.getContext('2d')
    if (!ctx) return

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data
      if (pixel[3] < 10) {
        feedback.notify({
          title: tr('cutout.pickInvalid', '点击位置属于透明区域'),
          description: tr('cutout.pickInvalidDesc', '请点击图像中实体背景区域进行取色'),
          tone: 'warning',
        })
        return
      }

      const picked = { r: pixel[0], g: pixel[1], b: pixel[2] }
      setTargetColor(picked)
      setMode('color')
      setTolerance(15) // Set optimal precision tolerance for color keying
      setIsEyedropperActive(false)
      feedback.notify({
        title: tr('cutout.colorPicked', '已拾取目标背景色'),
        description: `RGB(${picked.r}, ${picked.g}, ${picked.b}) · 默认容差设定为 15%`,
        tone: 'success',
      })
    } catch (err) {
      console.error('Failed to pick color from canvas', err)
    }
  }

  const handleApply = () => {
    if (!activeNode || !previewUrl) return
    const storeNode = useEditorStore.getState().elements.find((el) => el.id === activeNode.id) || activeNode
    const currentProps = storeNode.props || {}
    const pristineUrl = currentProps.originalUrl || storeNode.url || originalUrl

    updateNode(activeNode.id, {
      url: previewUrl,
      props: {
        ...currentProps,
        originalUrl: pristineUrl,
        lastCutoutMode: mode,
        lastCutoutTolerance: tolerance,
      },
    } as any)

    feedback.notify({
      title: tr('cutout.appliedSuccess', '抠图已保存并应用到画布'),
      tone: 'success',
    })
    onOpenChange(false)
  }

  const hexColor = `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border border-border shadow-2xl text-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-500" />
            <span>{tr('cutout.modalTitle', '✨ 专业智能抠图与背景消除工坊')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden min-h-0">
          {/* Preview Viewport with Transparent Checkerboard */}
          <div className="md:col-span-8 bg-editor-darker p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            <div className="relative max-w-full max-h-full flex items-center justify-center p-2 border border-border/40 rounded-lg shadow-xl bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
              {isEyedropperActive ? (
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="max-h-[55vh] max-w-full object-contain cursor-crosshair border-2 border-dashed border-blue-500 animate-pulse rounded"
                />
              ) : (
                <img
                  src={previewUrl || originalUrl}
                  alt="Cutout Preview"
                  className="max-h-[55vh] max-w-full object-contain rounded transition-all"
                />
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-bold text-blue-400 rounded">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{tr('cutout.processing', '智能算力抠图计算中...')}</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-4 text-[10px] text-muted-foreground bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border">
              {isEyedropperActive
                ? tr('cutout.eyedropperHint', '🎯 请在左侧图片上直接点击要扣除的目标色彩')
                : tr('cutout.viewportHint', '🏁 棋盘格区域代表已扣除的透明透明像素')}
            </div>
          </div>

          {/* Control Panel */}
          <div className="md:col-span-4 p-5 border-l border-border bg-card flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{tr('cutout.modeSelect', '抠图算法模式')}</span>
              </div>

              {/* Mode Select Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'white', label: tr('cutout.modeWhite', '⚪ 浅白背景') },
                  { id: 'chroma', label: tr('cutout.modeChroma', '🟢 绿幕/蓝幕') },
                  { id: 'dark', label: tr('cutout.modeDark', '🔴 暗黑背景') },
                  { id: 'color', label: tr('cutout.modeColor', '🎯 吸管指定色') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMode(item.id as any)
                      if (item.id === 'color') {
                        setIsEyedropperActive(true)
                        setTolerance(15)
                      } else {
                        setIsEyedropperActive(false)
                        setTolerance(35)
                      }
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded border transition-all text-center truncate ${
                      mode === item.id
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Custom Eyedropper Section */}
              {mode === 'color' && (
                <div className="p-3 bg-muted/30 rounded border border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tr('cutout.targetColor', '选定目标色彩')}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-border shadow-inner" style={{ backgroundColor: hexColor }} />
                      <span className="font-mono text-[10px] text-muted-foreground">{hexColor}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                    className={`w-full py-1.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      isEyedropperActive
                        ? 'bg-blue-600 text-white border-blue-500 animate-pulse'
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <Pipette className="w-3.5 h-3.5" />
                    <span>{isEyedropperActive ? tr('cutout.clickImageToPick', '点击图片拾取色彩') : tr('cutout.activateEyedropper', '开启吸管取色')}</span>
                  </button>
                </div>
              )}

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">{tr('cutout.tolerance', '抠图颜色容差')}</span>
                    <span className="font-mono text-blue-400 font-bold">{tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">{tr('cutout.feather', '边缘平滑与羽化')}</span>
                    <span className="font-mono text-blue-400 font-bold">{feather}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    className="w-full accent-blue-500 h-1.5 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invert}
                      onChange={(e) => setInvert(e.target.checked)}
                      className="accent-blue-500 w-4 h-4"
                    />
                    <span>{tr('cutout.invertSelection', '一键反选 (保留指定区域)')}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('white')
                  setTolerance(35)
                  setFeather(1)
                  setInvert(false)
                  setPreviewUrl(originalUrl)
                }}
                className="flex-1 py-2 px-3 bg-muted border border-border hover:bg-muted/80 text-foreground text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{tr('cutout.reset', '重置原图')}</span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="py-2 px-4 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded border border-border transition-colors"
          >
            {tr('common.cancel', '取消')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!previewUrl || isProcessing}
            className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{tr('cutout.applyToCanvas', '应用并覆盖到画布')}</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
