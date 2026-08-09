import { useState, useEffect, useRef, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useEditorStore } from '@/store/useEditorStore'
import { processProfessionalCutout, loadImageWithCorsFallback, type CutoutOptions } from '@/lib/imageProcess'
import { useFeedback } from '@/lib/feedback'
import { Wand2, Pipette, RefreshCw, Check, SlidersHorizontal, X, Trash2 } from 'lucide-react'

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

  // Continuous Multi-point Color Keying Array
  const [targetColors, setTargetColors] = useState<Array<{ r: number; g: number; b: number }>>([])
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false)
  const [hoverColor, setHoverColor] = useState<{ r: number; g: number; b: number } | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  // Draw original image on internal canvas whenever modal opens or originalUrl changes
  useEffect(() => {
    if (!open || !originalUrl) return
    let isCancelled = false

    loadImageWithCorsFallback(originalUrl)
      .then((img) => {
        if (isCancelled) return
        const drawOnCanvas = () => {
          const cvs = canvasRef.current
          if (!cvs) return
          cvs.width = img.naturalWidth || img.width
          cvs.height = img.naturalHeight || img.height
          const ctx = cvs.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
          }
        }
        drawOnCanvas()
        setTimeout(drawOnCanvas, 50)
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
        targetColors,
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
    }, 120)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [open, originalUrl, mode, targetColors, tolerance, feather, invert])

  // Mouse move handler for live color inspector
  const handleCanvasMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !canvasRef.current) return
    const cvs = canvasRef.current
    const rect = cvs.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const scaleX = cvs.width / rect.width
    const scaleY = cvs.height / rect.height

    const x = Math.min(cvs.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)))
    const y = Math.min(cvs.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)))

    const ctx = cvs.getContext('2d')
    if (!ctx) return

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data
      setHoverColor({ r: pixel[0], g: pixel[1], b: pixel[2] })
    } catch {
      // Ignore
    }
  }

  // Continuous Canvas Eyedropper click handler
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive || !canvasRef.current) return
    const cvs = canvasRef.current
    const rect = cvs.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const scaleX = cvs.width / rect.width
    const scaleY = cvs.height / rect.height

    const x = Math.min(cvs.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)))
    const y = Math.min(cvs.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)))

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

      setTargetColors((prev) => {
        const exists = prev.some((c) => Math.abs(c.r - picked.r) < 3 && Math.abs(c.g - picked.g) < 3 && Math.abs(c.b - picked.b) < 3)
        return exists ? prev : [...prev, picked]
      })
      setMode('color')
      setTolerance(12) // Optimal default precision tolerance for continuous keying

      // KEEP EYEDROPPER ACTIVE FOR CONTINUOUS CLICKING!
      setIsEyedropperActive(true)

      feedback.notify({
        title: tr('cutout.colorPickedContinuous', '已追加背景采样色 (连续取色模式生效)'),
        description: `RGB(${picked.r}, ${picked.g}, ${picked.b}) · 吸管保持激活，可继续点击图片其他背景区域`,
        tone: 'success',
      })
    } catch (err) {
      console.error('Failed to pick color from canvas', err)
    }
  }

  const removeTargetColor = (index: number) => {
    setTargetColors((prev) => prev.filter((_, i) => i !== index))
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

  const hoverHexColor = hoverColor ? `rgb(${hoverColor.r}, ${hoverColor.g}, ${hoverColor.b})` : ''

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

            {/* Live Hover Inspector Badge */}
            {isEyedropperActive && hoverColor && (
              <div className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/50 shadow-xl flex items-center gap-2 text-xs font-mono animate-fade-in pointer-events-none">
                <span className="w-4 h-4 rounded-full border border-white/40 shadow-inner" style={{ backgroundColor: hoverHexColor }} />
                <span className="font-bold text-blue-400">{hoverHexColor}</span>
              </div>
            )}

            <div className="relative max-w-full max-h-full flex items-center justify-center p-2 border border-border/40 rounded-lg shadow-xl bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
              {/* Canvas is ALWAYS present in DOM for accurate pixel sampling */}
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                className={`max-h-[55vh] max-w-full object-contain transition-all ${
                  isEyedropperActive
                    ? 'cursor-crosshair border-2 border-dashed border-blue-500 animate-pulse rounded block z-10'
                    : 'hidden'
                }`}
              />

              {!isEyedropperActive && (
                <img
                  src={previewUrl || originalUrl}
                  alt="Cutout Preview"
                  className="max-h-[55vh] max-w-full object-contain rounded transition-all"
                />
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-bold text-blue-400 rounded z-20">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{tr('cutout.processing', '智能算力抠图计算中...')}</span>
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-4 text-[10px] text-muted-foreground bg-background/80 backdrop-blur px-2.5 py-1 rounded border border-border z-20 flex items-center gap-2">
              <span>
                {isEyedropperActive
                  ? tr('cutout.eyedropperContinuousHint', '🎯 连续取色中：直接在图片上连续点击多个不同背景位置，即可一次性干干脆脆完全剔除渐变/杂色背景！')
                  : tr('cutout.viewportHint', '🏁 棋盘格区域代表已扣除的透明像素')}
              </span>
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
                  { id: 'color', label: tr('cutout.modeColor', '🎯 连续吸管抠图') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMode(item.id as any)
                      if (item.id === 'color') {
                        setIsEyedropperActive(true)
                        setTolerance(12)
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

              {/* Custom Continuous Eyedropper Section */}
              {mode === 'color' && (
                <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Pipette className="w-3.5 h-3.5 text-blue-400" />
                      <span>{tr('cutout.targetColors', '已采样背景色点')} ({targetColors.length})</span>
                    </span>
                    {targetColors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTargetColors([])}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>清空采样</span>
                      </button>
                    )}
                  </div>

                  {/* Picked Colors Badges */}
                  {targetColors.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {targetColors.map((col, idx) => {
                        const colStr = `rgb(${col.r},${col.g},${col.b})`
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2 py-0.5 bg-background border border-border rounded-full text-[10px] font-mono shadow-sm group"
                          >
                            <span className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: colStr }} />
                            <span>{colStr}</span>
                            <button
                              type="button"
                              onClick={() => removeTargetColor(idx)}
                              className="text-muted-foreground hover:text-rose-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground text-center py-1">
                      {tr('cutout.noColorsPicked', '点击下方按钮后在图片上连续多点采样取色')}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                    className={`w-full py-1.5 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 border transition-all shadow ${
                      isEyedropperActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 animate-pulse'
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    <Pipette className="w-3.5 h-3.5" />
                    <span>
                      {isEyedropperActive
                        ? tr('cutout.continuousActiveState', '🎯 连续取色激活中 (直接连续点击图片多处)')
                        : tr('cutout.activateContinuousEyedropper', '开启连续吸管取色')}
                    </span>
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
                  setTargetColors([])
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
