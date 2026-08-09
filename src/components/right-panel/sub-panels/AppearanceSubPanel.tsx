import { useState, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'
import { Input } from '@/components/ui/input'
import { ColorPickerWithAlpha } from '@/components/ui/color-picker'
import { removeImageBackground, applyImageEffects, BEAUTY_PRESETS } from '@/lib/imageProcess'
import { useFeedback } from '@/lib/feedback'
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Lock, Unlock, Wand2, Target
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CutoutModal } from '@/components/feedback/CutoutModal'
import { Row, NumInput, ToggleCheck, Section } from './PanelCommon'

export function AppearanceSubPanel({ node }: { node: any }) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const updateNode = useEditorStore((s) => s.updateNode)
  const alignNodes = useEditorStore((s) => s.alignNodes)
  const u = (k: string, v: any) => updateNode(node.id, { [k]: v })
  const p = node.props || {}
  const up = (k: string, v: any) => u('props', { ...p, [k]: v })
  const [lockRatio, setLockRatio] = useState(false)
  const [isProcessingCutout, setIsProcessingCutout] = useState(false)
  const [isCutoutModalOpen, setIsCutoutModalOpen] = useState(false)

  const handleCutout = async (mode: 'white' | 'chroma' = 'white', threshold = 35) => {
    const storeNode = useEditorStore.getState().elements.find((el) => el.id === node.id) || node
    const currentProps = storeNode.props || node.props || {}
    const pristineUrl = currentProps.originalUrl || storeNode.url || node.url
    if (!pristineUrl) {
      feedback.notify({ title: '没有可抠图的图片 URL', tone: 'warning' })
      return
    }
    setIsProcessingCutout(true)
    try {
      const transparentUrl = await removeImageBackground(pristineUrl, mode, threshold)
      updateNode(node.id, {
        url: transparentUrl,
        props: { ...currentProps, originalUrl: pristineUrl, lastCutoutMode: mode, lastCutoutTolerance: threshold },
      } as any)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessingCutout(false)
    }
  }

  const handleApplyEffect = async (opts: { presetId?: string; brightness?: number; contrast?: number; saturate?: number; blur?: number }) => {
    if (node.type !== 'Image') return
    const storeNode = useEditorStore.getState().elements.find((el) => el.id === node.id) || node
    const currentProps = storeNode.props || node.props || {}
    const pristineUrl = currentProps.originalUrl || storeNode.url || node.url
    if (!pristineUrl) return

    const nextPresetId = opts.presetId !== undefined ? opts.presetId : (currentProps.activePresetId || 'original')
    const nextBlur = opts.blur !== undefined ? opts.blur : (currentProps.blur || 0)
    const nextBrightness = opts.brightness !== undefined ? opts.brightness : (currentProps.brightness || 100)
    const nextContrast = opts.contrast !== undefined ? opts.contrast : (currentProps.contrast || 100)
    const nextSaturate = opts.saturate !== undefined ? opts.saturate : (currentProps.saturate || 100)

    const updatedProps = {
      ...currentProps,
      originalUrl: pristineUrl,
      activePresetId: nextPresetId,
      blur: nextBlur,
      brightness: nextBrightness,
      contrast: nextContrast,
      saturate: nextSaturate,
    }

    if (nextPresetId === 'original' && nextBlur === 0) {
      updateNode(node.id, {
        url: pristineUrl,
        props: updatedProps,
      } as any)
      return
    }

    try {
      const filteredUrl = await applyImageEffects(pristineUrl, {
        presetId: nextPresetId,
        brightness: nextBrightness,
        contrast: nextContrast,
        saturate: nextSaturate,
        blur: nextBlur,
      })

      if (filteredUrl && filteredUrl !== 'data:,' && filteredUrl.length > 5) {
        updateNode(node.id, {
          url: filteredUrl,
          props: updatedProps,
        } as any)
      }
    } catch (err) {
      console.error('Failed to apply image effect:', err)
    }
  }

  const isGradient = typeof node.fill === 'object' && node.fill !== null
  const solidColor = isGradient ? (node.fill.stops?.[0] || '#3b82f6') : (node.fill || '#3b82f6')
  const stop1 = isGradient ? (node.fill.stops?.[0] || '#ff4b4b') : '#ff4b4b'
  const stop2 = isGradient ? (node.fill.stops?.[1] || '#feb027') : '#feb027'
  const gradType = isGradient ? (node.fill.type || 'linear') : 'linear'
  const gradFrom = isGradient ? (node.fill.from || 'left') : 'left'

  const handleWidth = (v: number) => {
    if (lockRatio && node.width && node.height) {
      u('height', Math.round((v * node.height) / node.width))
    }
    u('width', v)
  }
  const handleHeight = (v: number) => {
    if (lockRatio && node.width && node.height) {
      u('width', Math.round((v * node.width) / node.height))
    }
    u('height', v)
  }

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  return (
    <div className="p-3">
      {/* Alignment */}
      <Section title={tr('config.appearance.alignment', '对齐与分布')}>
        <div className="flex flex-wrap gap-1">
          {([
            { icon: AlignLeft, fn: 'left', title: tr('config.appearance.alignLeft', '左对齐') },
            { icon: AlignCenterVertical, fn: 'center', title: tr('config.appearance.alignCenter', '居中对齐') },
            { icon: AlignRight, fn: 'right', title: tr('config.appearance.alignRight', '右对齐') },
            { icon: AlignStartVertical, fn: 'top', title: tr('config.appearance.alignTop', '顶部对齐') },
            { icon: AlignCenter, fn: 'middle', title: tr('config.appearance.alignMiddle', '垂直居中') },
            { icon: AlignEndVertical, fn: 'bottom', title: tr('config.appearance.alignBottom', '底部对齐') },
            { icon: AlignHorizontalSpaceAround, fn: 'distribute-x', title: tr('config.appearance.distributeX', '水平均齐') },
            { icon: AlignVerticalSpaceAround, fn: 'distribute-y', title: tr('config.appearance.distributeY', '垂直均齐') },
          ] as const).map(({ icon: Icon, fn, title }) => (
            <button
              key={fn}
              title={title}
              onClick={() => alignNodes(fn as any)}
              className="w-8 h-7 flex items-center justify-center bg-editor-deep rounded border border-border hover:border-blue-500 hover:text-blue-400 text-editor-text-label transition-colors"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </Section>

      {/* Position and Size */}
      <Section title={tr('config.appearance.position', '位置坐标与比例')}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-[10px] text-editor-text-dim mb-1">{tr('config.appearance.x', 'X 轴坐标')}</div>
            <NumInput value={node.x} onChange={(v) => u('x', v)} />
          </div>
          <div>
            <div className="text-[10px] text-editor-text-dim mb-1">{tr('config.appearance.y', 'Y 轴坐标')}</div>
            <NumInput value={node.y} onChange={(v) => u('y', v)} />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-editor-text-dim">{tr('config.appearance.width', '宽度 (W)')}</span>
            </div>
            <NumInput value={node.width || 100} onChange={handleWidth} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-editor-text-dim">{tr('config.appearance.height', '高度 (H)')}</span>
              <button onClick={() => setLockRatio(!lockRatio)} title={tr('config.appearance.lockRatio', '锁定宽高比')} className="text-editor-text-dim hover:text-blue-400">
                {lockRatio ? <Lock className="w-3 h-3 text-blue-400" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
            <NumInput value={node.height || 100} onChange={handleHeight} />
          </div>
        </div>
        <Row label={tr('config.appearance.rotateAndFlip', '旋转与翻转')}>
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <NumInput value={node.rotation || 0} onChange={(v) => u('rotation', v)} />
            <button
              type="button"
              onClick={() => up('flipH', !p.flipH)}
              title={tr('config.appearance.flipHHint', '水平镜像翻转')}
              className={`w-7 h-7 flex items-center justify-center text-sm font-bold rounded border transition-colors ${
                p.flipH ? 'bg-blue-600 border-blue-500 text-white' : 'bg-editor-deep border-border text-editor-text-label hover:border-blue-400 hover:text-editor-text'
              }`}
            >
              ⇄
            </button>
            <button
              type="button"
              onClick={() => up('flipV', !p.flipV)}
              title={tr('config.appearance.flipVHint', '垂直镜像翻转')}
              className={`w-7 h-7 flex items-center justify-center text-sm font-bold rounded border transition-colors ${
                p.flipV ? 'bg-blue-600 border-blue-500 text-white' : 'bg-editor-deep border-border text-editor-text-label hover:border-blue-400 hover:text-editor-text'
              }`}
            >
              ⇅
            </button>
          </div>
        </Row>
        <Row label={tr('config.appearance.anchor', '锚点配置')}>
          <div className="flex items-center gap-1 flex-1 justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title={tr('config.appearance.anchorPicker', '九宫格锚点快捷选择')}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded border bg-editor-deep border-border hover:border-blue-500 text-blue-400 transition-colors shrink-0"
                >
                  <Target className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2 bg-card border border-border shadow-xl z-50">
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5 text-center">
                  {tr('config.appearance.anchorPreset', '锚点预设位置')}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: '左上', x: 0, y: 0 },
                    { label: '中上', x: 0.5, y: 0 },
                    { label: '右上', x: 1, y: 0 },
                    { label: '左中', x: 0, y: 0.5 },
                    { label: '中心', x: 0.5, y: 0.5 },
                    { label: '右中', x: 1, y: 0.5 },
                    { label: '左下', x: 0, y: 1 },
                    { label: '中下', x: 0.5, y: 1 },
                    { label: '右下', x: 1, y: 1 },
                  ].map((preset) => {
                    const currentX = node.anchorX ?? 0.5
                    const currentY = node.anchorY ?? 0.5
                    const active = Math.abs(currentX - preset.x) < 0.05 && Math.abs(currentY - preset.y) < 0.05
                    return (
                      <button
                        key={`${preset.x}-${preset.y}`}
                        type="button"
                        onClick={() => {
                          u('anchorX', preset.x)
                          u('anchorY', preset.y)
                        }}
                        className={`h-6 text-[10px] font-bold rounded border transition-colors ${
                          active
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-editor-text-dim font-mono">X:</span>
              <NumInput value={node.anchorX ?? 0.5} onChange={(v) => u('anchorX', v)} w="w-12" />
              <span className="text-[9px] text-editor-text-dim font-mono">Y:</span>
              <NumInput value={node.anchorY ?? 0.5} onChange={(v) => u('anchorY', v)} w="w-12" />
            </div>
          </div>
        </Row>
        <Row label={tr('config.appearance.opacity', '透明度')}>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={node.opacity ?? 1}
              onChange={(e) => u('opacity', Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1"
            />
            <span className="text-[11px] text-editor-text w-8 text-right">{Math.round((node.opacity ?? 1) * 100)}%</span>
          </div>
        </Row>
      </Section>

      {/* Fill Color */}
      {node.type !== 'Image' && (
        <Section title={tr('config.appearance.look', '填充与线条')}>
          <div className="flex gap-1.5 mb-2 bg-editor-deep p-0.5 rounded border border-border">
            <button
              type="button"
              onClick={() => {
                if (isGradient) {
                  u('fill', '#3b82f6')
                }
              }}
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${!isGradient ? 'bg-blue-600 text-editor-text' : 'text-editor-text-label hover:text-editor-text'}`}
            >
              {tr('config.appearance.solidFill', '纯色填充')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isGradient) {
                  u('fill', {
                    type: 'linear',
                    from: 'left',
                    to: 'right',
                    stops: [solidColor, '#feb027'],
                  })
                }
              }}
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isGradient ? 'bg-blue-600 text-editor-text' : 'text-editor-text-label hover:text-editor-text'}`}
            >
              {tr('config.appearance.gradientFill', '渐变填充')}
            </button>
          </div>

          {!isGradient ? (
            <Row label={tr('config.appearance.fillColor', '填充颜色')}>
              <ColorPickerWithAlpha value={solidColor} onChange={(c) => u('fill', c)} />
            </Row>
          ) : (
            <div className="space-y-2 pl-2 border-l border-border/50">
              <Row label={tr('config.appearance.gradType', '渐变类型')}>
                <select
                  value={gradType}
                  onChange={(e) => u('fill', { ...node.fill, type: e.target.value })}
                  className="w-24 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
                >
                  <option value="linear">{tr('config.appearance.linearGrad', '线性渐变')}</option>
                  <option value="radial">{tr('config.appearance.radialGrad', '径向渐变')}</option>
                </select>
              </Row>
              <Row label={tr('config.appearance.gradFrom', '渐变方向')}>
                <select
                  value={gradFrom}
                  onChange={(e) => {
                    const val = e.target.value
                    let toVal = 'right'
                    if (val === 'top') toVal = 'bottom'
                    if (val === 'top-left') toVal = 'bottom-right'
                    if (val === 'center') toVal = 'bottom'
                    u('fill', { ...node.fill, from: val, to: toVal })
                  }}
                  className="w-24 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
                >
                  <option value="left">{tr('config.appearance.leftToRight', '左到右')}</option>
                  <option value="top">{tr('config.appearance.topToBottom', '上到下')}</option>
                  <option value="top-left">{tr('config.appearance.diagonal', '对角线')}</option>
                  <option value="center">{tr('config.appearance.radialSpread', '径向扩散')}</option>
                </select>
              </Row>
              <Row label={tr('config.appearance.stopColors', '起止颜色')}>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={stop1}
                    onChange={(e) => u('fill', { ...node.fill, stops: [e.target.value, stop2] })}
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] text-editor-text-dim">{tr('config.appearance.to', '至')}</span>
                  <input
                    type="color"
                    value={stop2}
                    onChange={(e) => u('fill', { ...node.fill, stops: [stop1, e.target.value] })}
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </Row>
            </div>
          )}
          <Row label={tr('config.appearance.strokeColor', '描边轮廓')}>
            <div className="flex flex-col gap-1.5 w-full">
              <ColorPickerWithAlpha value={p.stroke || '#ffffff'} onChange={(c) => up('stroke', c)} />
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] text-editor-text-dim">{tr('config.appearance.strokeThickness', '粗细')}</span>
                <NumInput value={p.strokeWidth || 0} onChange={(v) => up('strokeWidth', v)} w="w-14" />
                <span className="text-[10px] text-editor-text-dim">px</span>
              </div>
            </div>
          </Row>
          <Row label={tr('config.appearance.cornerRadius', '边框圆角')}>
            <NumInput
              value={p.cornerRadius || node.cornerRadius || 0}
              onChange={(v) => {
                up('cornerRadius', v)
                u('cornerRadius', v)
              }}
            />
          </Row>
        </Section>
      )}

      {/* Shadow */}
      <Section title={tr('config.appearance.shadow', '阴影特效')}>
        <div className="flex items-center gap-2 mb-2">
          <ToggleCheck checked={!!p.shadow} onChange={(v) => up('shadow', v)} label={tr('config.appearance.enableShadow', '开启阴影')} />
        </div>
        {p.shadow && (
          <>
            <Row label={tr('config.appearance.shadowColor', '阴影颜色')}>
              <input
                type="color"
                value={p.shadowColor || '#000000'}
                onChange={(e) => up('shadowColor', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
            </Row>
            <Row label={tr('config.appearance.shadowBlur', '阴影模糊')}>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={p.shadowBlur || 8}
                  onChange={(e) => up('shadowBlur', Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-xs text-editor-text w-6 text-right">{p.shadowBlur || 8}</span>
              </div>
            </Row>
            <Row label={tr('config.appearance.shadowX', '偏移 X')}>
              <NumInput value={p.shadowX || 4} onChange={(v) => up('shadowX', v)} />
            </Row>
            <Row label={tr('config.appearance.shadowY', '偏移 Y')}>
              <NumInput value={p.shadowY || 4} onChange={(v) => up('shadowY', v)} />
            </Row>
          </>
        )}
      </Section>

      {/* Image Specific & Advanced Photo Editing */}
      {node.type === 'Image' && (
        <>
          <Section title={tr('config.appearance.imageProps', '图片基础属性')}>
            <Row label={tr('config.appearance.imagePath', '图片路径')}>
              <Input
                value={node.url || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => u('url', e.target.value)}
                placeholder="https://..."
                className="flex-1 h-7 bg-editor-deep border-border text-editor-text text-xs font-mono"
              />
            </Row>
            <div className="flex flex-wrap gap-3 mt-2">
              <ToggleCheck checked={!!p.flipH} onChange={(v) => up('flipH', v)} label={tr('config.appearance.flipH', '水平翻转')} />
              <ToggleCheck checked={!!p.flipV} onChange={(v) => up('flipV', v)} label={tr('config.appearance.flipV', '垂直翻转')} />
              <ToggleCheck checked={!!p.contain} onChange={(v) => up('contain', v)} label={tr('config.appearance.contain', '等比缩放')} />
            </div>
          </Section>

          {/* 1. Smart Cutout / Background Removal */}
          <Section title={tr('config.appearance.aiMattingTitle', '✨ 智能 P 图抠图 (背景消除)')}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsCutoutModalOpen(true)}
                className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Wand2 className="w-4 h-4" />
                <span>{tr('config.appearance.openCutoutStudio', '打开专业抠图与背景工坊')}</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={isProcessingCutout}
                  onClick={() => handleCutout('white')}
                  className="py-1 px-2 bg-editor-deep hover:bg-muted border border-border text-editor-text text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <span>{tr('config.appearance.cutoutWhite', '⚪ 消除浅白背景')}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingCutout}
                  onClick={() => handleCutout('chroma')}
                  className="py-1 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <span>{tr('config.appearance.cutoutChroma', '🟢 绿幕抠图')}</span>
                </button>
              </div>

              {/* Quick Cutout Tolerance & Feathering controls in panel */}
              <div className="p-2.5 bg-editor-deep rounded border border-border/70 space-y-2 text-xs">
                <Row label={tr('config.appearance.cutoutTolerance', '抠图容差')}>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="range"
                      min="5"
                      max="85"
                      value={p.lastCutoutTolerance || 35}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        up('lastCutoutTolerance', val)
                        handleCutout(p.lastCutoutMode || 'white', val)
                      }}
                      className="flex-1 accent-blue-500 h-1.5"
                    />
                    <span className="text-[11px] font-mono text-editor-text w-7 text-right">{p.lastCutoutTolerance || 35}%</span>
                  </div>
                </Row>
              </div>
            </div>
          </Section>

          {/* 2. Mosaic & Blur */}
          <Section title={tr('config.appearance.mosaicBlurTitle', '🔲 马赛克与模糊打码')}>
            <Row label={tr('config.appearance.mosaicBlur', '马赛克/模糊')}>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={node.blur || 0}
                  onChange={(e) => handleApplyEffect({ blur: Number(e.target.value) })}
                  className="flex-1 accent-blue-500 h-1.5"
                />
                <span className="text-xs text-editor-text w-8 text-right font-mono">{node.blur || 0}px</span>
              </div>
            </Row>
          </Section>

          {/* 3. Beauty Filters & Photo Adjustments */}
          <Section title={tr('config.appearance.beautyFiltersTitle', '💄 一键美颜与 P 图滤镜')}>
            <div className="grid grid-cols-3 gap-1.5">
              {BEAUTY_PRESETS.map((preset) => {
                const activePresetId = p.activePresetId || 'original'
                const isActive = activePresetId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      handleApplyEffect({
                        presetId: preset.id,
                        brightness: preset.brightness,
                        contrast: preset.contrast,
                        saturate: preset.saturate,
                        blur: preset.blur,
                      })
                    }
                    className={`py-1.5 px-1 text-[10px] font-bold rounded transition-all text-center truncate flex items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-blue-600 text-white border border-blue-400 shadow-md ring-2 ring-blue-500/40 font-black'
                        : 'bg-editor-deep hover:bg-muted border border-border text-editor-text hover:border-blue-500/50'
                    }`}
                  >
                    <span>{preset.nameKey ? tr(preset.nameKey, preset.name) : preset.name}</span>
                  </button>
                )
              })}
            </div>
          </Section>
        </>
      )}

      {/* Text Content */}
      {node.type === 'Text' && (
        <Section title={tr('config.appearance.textContent', '文字编辑')}>
          <textarea
            value={node.text || ''}
            onChange={(e) => u('text', e.target.value)}
            rows={3}
            className="w-full bg-editor-deep border border-border text-editor-text text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 resize-none"
          />
        </Section>
      )}

      {/* Standalone Mosaic Overlay Component Properties */}
      {node.type === 'Mosaic' && (
        <Section title={tr('config.appearance.mosaicSettings', '🔲 马赛克遮罩控件设置')}>
          <Row label={tr('config.appearance.pixelSize', '像素格子大小')}>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="4"
                max="32"
                step="1"
                value={p.pixelSize || 12}
                onChange={(e) => up('pixelSize', Number(e.target.value))}
                className="flex-1 accent-blue-500 h-1.5"
              />
              <span className="text-xs text-editor-text w-8 text-right font-mono">{p.pixelSize || 12}px</span>
            </div>
          </Row>
          <Row label={tr('config.appearance.maskOpacity', '遮罩透明度')}>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={node.opacity ?? 1}
                onChange={(e) => u('opacity', Number(e.target.value))}
                className="flex-1 accent-blue-500 h-1.5"
              />
              <span className="text-xs text-editor-text w-8 text-right font-mono">{Math.round((node.opacity ?? 1) * 100)}%</span>
            </div>
          </Row>
          <Row label={tr('config.appearance.cornerRadius', '圆角半径')}>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={node.cornerRadius || 0}
                onChange={(e) => u('cornerRadius', Number(e.target.value))}
                className="flex-1 accent-blue-500 h-1.5"
              />
              <span className="text-xs text-editor-text w-8 text-right font-mono">{node.cornerRadius || 0}px</span>
            </div>
          </Row>
        </Section>
      )}

      {/* Visibility and Locking */}
      <Section title={tr('config.appearance.visibility', '锁定与显隐')}>
        <div className="flex flex-wrap gap-3">
          <ToggleCheck checked={!!node.locked} onChange={(v) => u('locked', v)} label={tr('config.appearance.locked', '锁定')} />
          <ToggleCheck checked={!!node.hidden} onChange={(v) => u('hidden', v)} label={tr('config.appearance.hidden', '隐藏')} />
        </div>
      </Section>

      <CutoutModal open={isCutoutModalOpen} onOpenChange={setIsCutoutModalOpen} nodeId={node.id} />
    </div>
  )
}
