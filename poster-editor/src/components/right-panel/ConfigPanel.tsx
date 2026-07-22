import React, { useState, ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'
import { FontManager } from './FontManager'
import { Input } from '@/components/ui/input'
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  Lock, Unlock
} from 'lucide-react'

// ────────────────────────────────────
// Sub-components
// ────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 gap-2">
      <span className="text-[11px] text-editor-text-label shrink-0 w-16">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
    </div>
  )
}
function NumInput({ value, onChange, w = 'w-20' }: { value: number; onChange: (v: number) => void; w?: string }) {
  return (
    <input type="number" value={Math.round(value * 100) / 100} onChange={e => onChange(Number(e.target.value))}
      className={`${w} h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none focus:border-blue-500`} />
  )
}
function ToggleCheck({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-blue-500 w-3.5 h-3.5" />
      <span className="text-[11px] text-editor-text-label">{label}</span>
    </label>
  )
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-editor-text-dim uppercase tracking-widest mb-2 pb-1 border-b border-border">{title}</div>
      {children}
    </div>
  )
}

// ────────────────────────────────────
// Appearance tab
// ────────────────────────────────────
function AppearanceTab({ node }: { node: any }) {
  const { t } = useTranslation()
  const updateNode = useEditorStore(s => s.updateNode)
  const alignNodes = useEditorStore(s => s.alignNodes)
  const u = (k: string, v: any) => updateNode(node.id, { [k]: v })
  const p = node.props || {}
  const up = (k: string, v: any) => u('props', { ...p, [k]: v })
  const [lockRatio, setLockRatio] = useState(false)

  const isGradient = typeof node.fill === 'object' && node.fill !== null
  const solidColor = isGradient ? (node.fill.stops?.[0] || '#3b82f6') : (node.fill || '#3b82f6')
  const stop1 = isGradient ? (node.fill.stops?.[0] || '#ff4b4b') : '#ff4b4b'
  const stop2 = isGradient ? (node.fill.stops?.[1] || '#feb027') : '#feb027'
  const gradType = isGradient ? (node.fill.type || 'linear') : 'linear'
  const gradFrom = isGradient ? (node.fill.from || 'left') : 'left'

  const handleWidth = (v: number) => {
    if (lockRatio && node.width && node.height) {
      u('height', Math.round(v * node.height / node.width))
    }
    u('width', v)
  }
  const handleHeight = (v: number) => {
    if (lockRatio && node.width && node.height) {
      u('width', Math.round(v * node.width / node.height))
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
            <button key={fn} title={title}
              onClick={() => alignNodes(fn as any)}
              className="w-8 h-7 flex items-center justify-center bg-editor-deep rounded border border-border hover:border-blue-500 hover:text-blue-400 text-editor-text-label transition-colors">
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </Section>

      {/* Position and Size */}
      <Section title={tr('config.appearance.position', '位置坐标与比例')}>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-[10px] text-editor-text-dim mb-1">X 轴坐标</div>
            <NumInput value={node.x} onChange={v => u('x', v)} />
          </div>
          <div>
            <div className="text-[10px] text-editor-text-dim mb-1">Y 轴坐标</div>
            <NumInput value={node.y} onChange={v => u('y', v)} />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-editor-text-dim">宽度 (W)</span>
            </div>
            <NumInput value={node.width || 100} onChange={handleWidth} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-editor-text-dim">高度 (H)</span>
              <button onClick={() => setLockRatio(!lockRatio)} title="锁定宽高比" className="text-editor-text-dim hover:text-blue-400">
                {lockRatio ? <Lock className="w-3 h-3 text-blue-400" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
            <NumInput value={node.height || 100} onChange={handleHeight} />
          </div>
        </div>
        <Row label="旋转与翻转">
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <NumInput value={node.rotation || 0} onChange={v => u('rotation', v)} />
            <button
              type="button"
              onClick={() => up('flipH', !p.flipH)}
              title="水平镜像翻转"
              className={`w-7 h-7 flex items-center justify-center text-sm font-bold rounded border transition-colors ${p.flipH ? 'bg-blue-600 border-blue-500 text-white' : 'bg-editor-deep border-border text-editor-text-label hover:border-blue-400 hover:text-editor-text'}`}
            >
              ⇄
            </button>
            <button
              type="button"
              onClick={() => up('flipV', !p.flipV)}
              title="垂直镜像翻转"
              className={`w-7 h-7 flex items-center justify-center text-sm font-bold rounded border transition-colors ${p.flipV ? 'bg-blue-600 border-blue-500 text-white' : 'bg-editor-deep border-border text-editor-text-label hover:border-blue-400 hover:text-editor-text'}`}
            >
              ⇅
            </button>
          </div>
        </Row>
        <Row label={tr('config.appearance.opacity', '透明度')}>
          <div className="flex items-center gap-2 flex-1">
            <input type="range" min="0" max="1" step="0.01"
              value={node.opacity ?? 1}
              onChange={e => u('opacity', Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1" />
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
              纯色填充
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isGradient) {
                  u('fill', {
                    type: 'linear',
                    from: 'left',
                    to: 'right',
                    stops: [solidColor, '#feb027']
                  })
                }
              }}
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isGradient ? 'bg-blue-600 text-editor-text' : 'text-editor-text-label hover:text-editor-text'}`}
            >
              渐变填充
            </button>
          </div>

          {!isGradient ? (
            <Row label={tr('config.appearance.fillColor', '填充颜色')}>
              <div className="flex items-center gap-2">
                <input type="color" value={solidColor}
                  onChange={e => u('fill', e.target.value)}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent" />
                <input type="text" value={node.fill || ''}
                  onChange={e => u('fill', e.target.value)}
                  className="w-24 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 font-mono focus:outline-none" />
              </div>
            </Row>
          ) : (
            <div className="space-y-2 pl-2 border-l border-border/50">
              <Row label="渐变类型">
                <select value={gradType} onChange={e => u('fill', { ...node.fill, type: e.target.value })}
                  className="w-24 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card">
                  <option value="linear">线性渐变</option>
                  <option value="radial">径向渐变</option>
                </select>
              </Row>
              <Row label="渐变方向">
                <select value={gradFrom} onChange={e => {
                    const val = e.target.value
                    let toVal = 'right'
                    if (val === 'top') toVal = 'bottom'
                    if (val === 'top-left') toVal = 'bottom-right'
                    if (val === 'center') toVal = 'bottom'
                    u('fill', { ...node.fill, from: val, to: toVal })
                  }}
                  className="w-24 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card">
                  <option value="left">左到右</option>
                  <option value="top">上到下</option>
                  <option value="top-left">对角线</option>
                  <option value="center">径向扩散</option>
                </select>
              </Row>
              <Row label="起止颜色">
                <div className="flex items-center gap-1.5">
                  <input type="color" value={stop1}
                    onChange={e => u('fill', { ...node.fill, stops: [e.target.value, stop2] })}
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent" />
                  <span className="text-[10px] text-editor-text-dim">至</span>
                  <input type="color" value={stop2}
                    onChange={e => u('fill', { ...node.fill, stops: [stop1, e.target.value] })}
                    className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent" />
                </div>
              </Row>
            </div>
          )}
          <Row label={tr('config.appearance.strokeColor', '描边轮廓')}>
            <div className="flex items-center gap-2">
              <input type="color" value={p.stroke || '#ffffff'}
                onChange={e => up('stroke', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent" />
              <NumInput value={p.strokeWidth || 0} onChange={v => up('strokeWidth', v)} w="w-14" />
              <span className="text-[10px] text-editor-text-dim">px</span>
            </div>
          </Row>
          <Row label={tr('config.appearance.cornerRadius', '边框圆角')}>
            <NumInput value={p.cornerRadius || node.cornerRadius || 0} onChange={v => { up('cornerRadius', v); u('cornerRadius', v) }} />
          </Row>
        </Section>
      )}

      {/* Shadow */}
      <Section title={tr('config.appearance.shadow', '阴影特效')}>
        <div className="flex items-center gap-2 mb-2">
          <ToggleCheck checked={!!p.shadow} onChange={v => up('shadow', v)} label={tr('config.appearance.enableShadow', '开启阴影')} />
        </div>
        {p.shadow && (
          <>
            <Row label="阴影颜色">
              <input type="color" value={p.shadowColor || '#000000'}
                onChange={e => up('shadowColor', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent" />
            </Row>
            <Row label="阴影模糊">
              <div className="flex items-center gap-2 flex-1">
                <input type="range" min="0" max="40" step="1" value={p.shadowBlur || 8}
                  onChange={e => up('shadowBlur', Number(e.target.value))}
                  className="flex-1 accent-blue-500" />
                <span className="text-xs text-editor-text w-6 text-right">{p.shadowBlur || 8}</span>
              </div>
            </Row>
            <Row label="偏移 X">
              <NumInput value={p.shadowX || 4} onChange={v => up('shadowX', v)} />
            </Row>
            <Row label="偏移 Y">
              <NumInput value={p.shadowY || 4} onChange={v => up('shadowY', v)} />
            </Row>
          </>
        )}
      </Section>

      {/* Image Specific */}
      {node.type === 'Image' && (
        <Section title={tr('config.appearance.image', '图片属性')}>
          <Row label="图片路径">
            <Input value={node.url || ''} onChange={(e: ChangeEvent<HTMLInputElement>) => u('url', e.target.value)}
              placeholder="https://..." className="flex-1 h-7 bg-editor-deep border-border text-editor-text text-xs" />
          </Row>
          <div className="flex flex-wrap gap-3 mt-2">
            <ToggleCheck checked={!!p.flipH} onChange={v => up('flipH', v)} label={tr('config.appearance.flipH', '水平翻转')} />
            <ToggleCheck checked={!!p.flipV} onChange={v => up('flipV', v)} label={tr('config.appearance.flipV', '垂直翻转')} />
            <ToggleCheck checked={!!p.contain} onChange={v => up('contain', v)} label={tr('config.appearance.contain', '等比缩放')} />
          </div>
        </Section>
      )}

      {/* Text Content */}
      {node.type === 'Text' && (
        <Section title={tr('config.appearance.textContent', '文字编辑')}>
          <textarea
            value={node.text || ''}
            onChange={e => u('text', e.target.value)}
            rows={3}
            className="w-full bg-editor-deep border border-border text-editor-text text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 resize-none"
          />
        </Section>
      )}

      {/* Visibility and Locking */}
      <Section title={tr('config.appearance.visibility', '锁定与显隐')}>
        <div className="flex flex-wrap gap-3">
          <ToggleCheck checked={!!node.locked} onChange={v => u('locked', v)} label={tr('config.appearance.locked', '锁定')} />
          <ToggleCheck checked={!!node.hidden} onChange={v => u('hidden', v)} label={tr('config.appearance.hidden', '隐藏')} />
        </div>
      </Section>
    </div>
  )
}

// ────────────────────────────────────
// Animation tab
// ────────────────────────────────────
function AnimationTab({ node }: { node: any }) {
  const { t } = useTranslation()
  const updateNode = useEditorStore(s => s.updateNode)
  const anim = node.animation || {}

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  return (
    <div className="p-3">
      <Section title={tr('config.animation.title', '动效状态')}>
        <Row label={tr('config.animation.type', '动画类型')}>
          <select value={anim.type || ''} onChange={e => {
              const val = e.target.value
              updateNode(node.id, { animation: val ? { type: val as 'spin' | 'breathe', duration: anim.duration || 2 } : undefined })
            }}
            className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card">
            <option value="">{tr('config.animation.none', '静止')}</option>
            <option value="spin">旋转 (Spin)</option>
            <option value="breathe">呼吸泡泡 (Breathe)</option>
          </select>
        </Row>
        {anim.type && (
          <Row label={tr('config.animation.duration', '持续周期')}>
            <div className="flex items-center gap-2 flex-1">
              <input type="range" min="0.2" max="10" step="0.1" value={anim.duration || 2}
                onChange={e => updateNode(node.id, { animation: { ...anim, duration: Number(e.target.value) } })}
                className="flex-1 accent-blue-500" />
              <span className="text-xs text-editor-text w-8 text-right">{anim.duration || 2}s</span>
            </div>
          </Row>
        )}
      </Section>
    </div>
  )
}

// ────────────────────────────────────
// Component-specific props
// ────────────────────────────────────
function ComponentPropsTab({ node }: { node: any }) {
  const { t } = useTranslation()
  const updateNode = useEditorStore(s => s.updateNode)
  const p = node.props || {}
  const u = (k: string, v: any) => updateNode(node.id, { props: { ...p, [k]: v } })

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  if (node.type === 'Text') {
    return (
      <div className="p-3 border-t border-border mt-2">
        <Section title={tr('config.component.textStyle', '高级文字版式')}>
          <Row label={tr('config.component.fontSize', '文字字号')}>
            <NumInput value={p.fontSize || 16} onChange={v => u('fontSize', v)} />
          </Row>
          <Row label={tr('config.component.fontFamily', '字体包')}>
            <FontManager value={p.fontFamily || 'Inter'} onChange={v => u('fontFamily', v)} />
          </Row>
          <Row label="对齐分布">
            <select value={p.textAlign || 'left'} onChange={e => u('textAlign', e.target.value)}
              className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card">
              <option value="left">左对齐</option>
              <option value="center">水平居中对齐</option>
              <option value="right">右对齐</option>
            </select>
          </Row>
          <Row label="字距调整">
            <input type="text" value={p.letterSpacing || '0px'} onChange={e => u('letterSpacing', e.target.value)}
              className="w-20 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none" />
          </Row>
          <Row label="行高大小">
            <input type="text" value={p.lineHeight || '1.2'} onChange={e => u('lineHeight', e.target.value)}
              className="w-20 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none" />
          </Row>
          <div className="flex gap-3 mt-3">
            <ToggleCheck checked={!!p.bold} onChange={v => u('bold', v)} label={tr('config.component.bold', '加粗')} />
            <ToggleCheck checked={!!p.italic} onChange={v => u('italic', v)} label={tr('config.component.italic', '斜体')} />
            <ToggleCheck checked={!!p.underline} onChange={v => u('underline', v)} label="下划线" />
          </div>
        </Section>
      </div>
    )
  }

  if (node.type === 'QRCode' || node.type === 'Barcode') {
    const labelText = node.type === 'QRCode' ? '二维码跳转内容/网址' : '条形码编码数字'
    const defaultText = node.type === 'QRCode' ? 'https://postercraft.app' : '690123456789'
    return (
      <div className="p-3 border-t border-border mt-2">
        <Section title={node.type === 'QRCode' ? '二维码动态配置' : '条形码动态配置'}>
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-editor-text-dim">{labelText}</div>
            <textarea
              rows={3}
              value={node.text || defaultText}
              onChange={(e) => updateNode(node.id, { text: e.target.value })}
              className="w-full bg-editor-deep border border-border text-editor-text text-xs rounded p-2 focus:outline-none focus:border-blue-500 font-mono resize-none"
              placeholder="请输入数据..."
            />
            <div className="text-[10px] text-emerald-400 font-bold">✨ 修改上方文本后，画布中的码图形将实时重新生成</div>
          </div>
        </Section>
      </div>
    )
  }

  if (node.type === 'Image') {
    return (
      <div className="p-3 border-t border-border mt-2">
        <Section title="图片属性与滤镜">
          <Row label="填充模式">
            <select
              value={p.contain ? 'contain' : 'cover'}
              onChange={e => u('contain', e.target.value === 'contain')}
              className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
            >
              <option value="cover">裁剪填充 (Cover)</option>
              <option value="contain">等比完整 (Contain)</option>
            </select>
          </Row>
          <Row label="滤镜特效">
            <select
              value={p.filter || 'none'}
              onChange={e => u('filter', e.target.value)}
              className="flex-1 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
            >
              <option value="none">原图无滤镜</option>
              <option value="grayscale(100%)">黑白怀旧</option>
              <option value="sepia(80%)">暖调复古</option>
              <option value="blur(4px)">模糊马赛克</option>
              <option value="brightness(130%)">高光提亮</option>
              <option value="contrast(150%)">高对比胶片</option>
            </select>
          </Row>
        </Section>
      </div>
    )
  }

  return null
}

// ────────────────────────────────────
// Main ConfigPanel
// ────────────────────────────────────
const TABS = ['appearance', 'animation'] as const
type TabType = typeof TABS[number]

export function ConfigPanel() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<TabType>('appearance')
  const activeIds = useEditorStore(s => s.activeIds)
  const elements = useEditorStore(s => s.elements)

  const activeNode = activeIds.length >= 1 ? elements.find(el => el.id === activeIds[0]) : null

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  if (!activeNode) {
    return (
      <div className="flex-1 flex items-center justify-center text-editor-text-dim text-xs text-center p-4">
        {activeIds.length > 1 ? tr('config.multiSelect', `已选中 ${activeIds.length} 个元素`) : tr('config.selectHint', '点击画布中的元素以配置其外观样式属性')}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full text-editor-text">
      {/* Node name + type badge */}
      <div className="px-4 py-2.5 border-b border-editor-darker flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-editor-text truncate">{activeNode.type === 'Text' ? '文字图元' : activeNode.type === 'Image' ? '图片图元' : '几何图形'}</span>
        <span className="text-[10px] bg-blue-600/30 text-blue-400 rounded px-2 py-0.5 font-mono">{activeNode.id.slice(0, 10)}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-editor-darker shrink-0">
        {TABS.map(t2 => (
          <button key={t2} onClick={() => setTab(t2)}
            className={`flex-1 py-2 text-[11px] font-bold transition-colors ${tab === t2 ? 'border-b-2 border-blue-500 text-blue-500' : 'text-editor-text-label hover:text-editor-text'}`}>
            {t(`config.tabs.${t2}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'appearance' && <AppearanceTab node={activeNode} />}
        {tab === 'animation' && <AnimationTab node={activeNode} />}
        <ComponentPropsTab node={activeNode} />
      </div>
    </div>
  )
}
