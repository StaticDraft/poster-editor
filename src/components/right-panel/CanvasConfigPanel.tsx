import React from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore, CanvasConfig } from '@/store/useEditorStore'
import { ColorPickerWithAlpha } from '@/components/ui/color-picker'

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold text-editor-text-label border-b border-editor-darker">
        {title}
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 gap-2">
      <span className="text-[11px] text-editor-text-label shrink-0 min-w-[70px] max-w-[120px] leading-tight pr-1">{label}</span>
      <div className="flex-1 flex justify-end min-w-0">{children}</div>
    </div>
  )
}

function NumInput({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-20 h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 text-right focus:outline-none focus:border-blue-500"
    />
  )
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-8 h-4 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-border'} relative`}>
      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${checked ? 'right-0.5' : 'left-0.5'}`} />
    </button>
  )
}

export function CanvasConfigPanel() {
  const { t } = useTranslation()
  const config = useEditorStore(s => s.canvasConfig)
  const setCanvasConfig = useEditorStore(s => s.setCanvasConfig)
  const activeIds = useEditorStore(s => s.activeIds)
  const elements = useEditorStore(s => s.elements)
  const projectName = useEditorStore(s => s.projectName)
  const setProjectName = useEditorStore(s => s.setProjectName)
  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  // If a node is selected, this panel shouldn't render
  const activeNode = activeIds.length === 1 ? elements.find(e => e.id === activeIds[0]) : null
  if (activeNode) return null

  const set = (key: keyof CanvasConfig, val: any) => setCanvasConfig({ [key]: val })

  return (
    <div className="flex flex-col text-editor-text w-full overflow-x-hidden">
      <div className="px-4 py-3 border-b border-editor-darker text-xs font-bold text-editor-text">{tr('canvasConfig.title', '海报画布配置')}</div>

      {/* File operations */}
      <Section title={tr('canvasConfig.file', '工程文档')}>
        <Row label={tr('canvasConfig.fileName', '海报标题')}>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="w-full min-w-0 text-xs bg-editor-deep border border-border rounded px-2 h-7 text-editor-text focus:outline-none focus:border-blue-500"
          />
        </Row>
      </Section>

      <Section title={tr('canvasConfig.canvasSize', '海报像素尺寸')}>
        <Row label={tr('canvasConfig.presetRatio', '常用海报比例')}>
          <select
            onChange={e => {
              const val = e.target.value
              if (!val) return
              const [w, h] = val.split('x').map(Number)
              if (w && h) {
                setCanvasConfig({ width: w, height: h })
              }
            }}
            className="w-full min-w-0 text-xs bg-editor-deep border border-border text-editor-text rounded px-2 h-7 focus:outline-none focus:border-blue-500 bg-card truncate"
          >
            <option value="">{tr('canvasConfig.customSize', '自定义尺寸')}</option>
            <option value="800x1200">手机长图海报 (9:16) - 800x1200</option>
            <option value="1200x1200">电商/小红书方图 (1:1) - 1200x1200</option>
            <option value="1920x1080">横版横幅 Banner (16:9) - 1920x1080</option>
            <option value="1080x1920">抖音故事大图 (9:16) - 1080x1920</option>
            <option value="500x500">迷你小卡片 (1:1) - 500x500</option>
          </select>
        </Row>
        <Row label={tr('canvasConfig.width', '宽度 (W)')}>
          <NumInput value={config.width} onChange={v => set('width', v)} />
        </Row>
        <Row label={tr('canvasConfig.height', '高度 (H)')}>
          <NumInput value={config.height} onChange={v => set('height', v)} />
        </Row>
        <Row label={tr('canvasConfig.bgColor', '画布背景')}>
          {(() => {
            const bg = config.bgColor
            const isSolid = typeof bg === 'string'
            const isGradient = typeof bg === 'object' && (bg?.type === 'linear' || bg?.type === 'radial')
            const isImage = typeof bg === 'object' && bg?.type === 'image'

            return (
              <div className="flex flex-col gap-2 w-full">
                {/* Mode tabs */}
                <div className="flex bg-editor-deeper rounded overflow-hidden">
                  <button
                    onClick={() => setCanvasConfig({ bgColor: '#ffffff' })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isSolid ? 'bg-blue-600 text-white' : 'text-editor-text-label hover:text-editor-text'}`}
                  >{tr('canvasConfig.solidColor', '纯色')}</button>
                  <button
                    onClick={() => setCanvasConfig({ bgColor: { type: 'linear', from: 'top', to: 'bottom', stops: ['#667eea', '#764ba2'] } })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isGradient ? 'bg-blue-600 text-white' : 'text-editor-text-label hover:text-editor-text'}`}
                  >{tr('canvasConfig.gradientColor', '渐变')}</button>
                  <button
                    onClick={() => setCanvasConfig({ bgColor: { type: 'image', url: '', mode: 'cover' } })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isImage ? 'bg-blue-600 text-white' : 'text-editor-text-label hover:text-editor-text'}`}
                  >{tr('canvasConfig.imageBg', '图片')}</button>
                </div>

                {/* Solid color */}
                {isSolid && (
                  <div className="pt-1">
                    <ColorPickerWithAlpha
                      value={typeof bg === 'string' ? bg : '#ffffff'}
                      onChange={c => setCanvasConfig({ bgColor: c })}
                    />
                  </div>
                )}

                {/* Gradient */}
                {isGradient && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5 items-center">
                      <select value={bg.type} onChange={e => setCanvasConfig({ bgColor: { ...bg, type: e.target.value } })}
                        className="h-6 text-[10px] bg-editor-deep border border-border text-editor-text rounded px-1 focus:outline-none">
                        <option value="linear">{tr('config.appearance.linearGrad', '线性')}</option>
                        <option value="radial">{tr('config.appearance.radialGrad', '径向')}</option>
                      </select>
                      {bg.type === 'linear' && (
                        <select value={bg.from || 'top'} onChange={e => {
                          const dirMap: Record<string, string> = { top: 'bottom', left: 'right', 'top-left': 'bottom-right' }
                          setCanvasConfig({ bgColor: { ...bg, from: e.target.value, to: dirMap[e.target.value] || 'bottom' } })
                        }}
                          className="h-6 text-[10px] bg-editor-deep border border-border text-editor-text rounded px-1 focus:outline-none">
                          <option value="top">{tr('config.appearance.topToBottom', '↓ 从上到下')}</option>
                          <option value="left">{tr('config.appearance.leftToRight', '→ 从左到右')}</option>
                          <option value="top-left">{tr('config.appearance.diagonal', '↘ 对角线')}</option>
                        </select>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bg.stops?.[0] || '#667eea'}
                        onChange={e => setCanvasConfig({ bgColor: { ...bg, stops: [e.target.value, bg.stops?.[1] || '#764ba2'] } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
                      <div className="flex-1 h-4 rounded" style={{
                        background: bg.type === 'radial'
                          ? `radial-gradient(circle, ${bg.stops?.[0] || '#667eea'}, ${bg.stops?.[1] || '#764ba2'})`
                          : `linear-gradient(to right, ${bg.stops?.[0] || '#667eea'}, ${bg.stops?.[1] || '#764ba2'})`
                      }} />
                      <input type="color" value={bg.stops?.[1] || '#764ba2'}
                        onChange={e => setCanvasConfig({ bgColor: { ...bg, stops: [bg.stops?.[0] || '#667eea', e.target.value] } })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent" />
                    </div>
                  </div>
                )}

                {/* Image Background */}
                {isImage && (
                  <div className="flex flex-col gap-2 pt-1">
                    <input
                      type="text"
                      value={bg.url || ''}
                      onChange={e => setCanvasConfig({ bgColor: { ...bg, url: e.target.value } })}
                      placeholder={tr('canvasConfig.imageBgUrlPlaceholder', 'https://在线图片地址...')}
                      className="h-7 text-xs bg-editor-deep border border-border text-editor-text rounded px-2 focus:outline-none focus:border-blue-500 w-full font-mono"
                    />

                    {/* Local Image Upload Button */}
                    <label className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{tr('canvasConfig.uploadLocalBg', '上传本地图片作为背景')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string
                            if (dataUrl) {
                              setCanvasConfig({ bgColor: { type: 'image', url: dataUrl, mode: bg.mode || 'cover' } })
                            }
                          }
                          reader.readAsDataURL(file)
                          e.target.value = ''
                        }}
                      />
                    </label>

                    {/* Preset background materials gallery */}
                    <div className="space-y-1 mt-1">
                      <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                        <span>{tr('canvasConfig.selectFromGallery', '从精选素材库选取背景')}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { name: tr('canvasConfig.auroraArt', '极光艺术'), url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600' },
                          { name: tr('canvasConfig.memphisArt', '孟菲斯'), url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600' },
                          { name: tr('canvasConfig.marbleWhite', '大理石白'), url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600' },
                          { name: tr('canvasConfig.vibrantGrad', '炫彩渐变'), url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=600' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCanvasConfig({ bgColor: { type: 'image', url: item.url, mode: bg.mode || 'cover' } })}
                            title={item.name}
                            className={`h-10 rounded border overflow-hidden relative group transition-all ${bg.url === item.url ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-border hover:border-blue-400'}`}
                          >
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity">
                              {item.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <select value={bg.mode || 'cover'} onChange={e => setCanvasConfig({ bgColor: { ...bg, mode: e.target.value } })}
                      className="h-6 text-[10px] bg-editor-deep border border-border text-editor-text rounded px-1 focus:outline-none mt-1">
                      <option value="cover">{tr('config.component.cover', '铺满裁剪 (Cover)')}</option>
                      <option value="contain">{tr('config.component.contain', '完整显示 (Contain)')}</option>
                      <option value="repeat">{tr('canvasConfig.repeatMode', '平铺重复 (Repeat)')}</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setCanvasConfig({ bgColor: '#ffffff' })}
                  className="mt-2.5 w-full py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border rounded transition-colors"
                >
                  {tr('canvasConfig.resetBg', '重置为默认纯白背景')}
                </button>
              </div>
            )
          })()}
        </Row>
      </Section>

      <Section title={tr('canvasConfig.previewSettings', '预览控制')}>
        <Row label={tr('canvasConfig.scaleMode', '铺满模式')}>
          <select
            value={config.scaleMode}
            onChange={e => set('scaleMode', e.target.value as any)}
            className="h-7 bg-editor-deep border border-border text-editor-text text-xs rounded px-2 focus:outline-none bg-card"
          >
            <option value="auto">{tr('canvasConfig.scaleAuto', '自动缩放')}</option>
            <option value="fit-w">{tr('canvasConfig.scaleFitW', '宽度铺满')}</option>
            <option value="fit-h">{tr('canvasConfig.scaleFitH', '高度铺满')}</option>
          </select>
        </Row>
        <Row label={tr('canvasConfig.lockPan', '禁止平移拖拽')}>
          <Toggle checked={!!config.lockPan} onChange={v => set('lockPan', v)} />
        </Row>
        <Row label={tr('canvasConfig.lockZoom', '禁止滚轮缩放')}>
          <Toggle checked={!!config.lockZoom} onChange={v => set('lockZoom', v)} />
        </Row>
      </Section>

      <Section title={tr('canvasConfig.auxSettings', '辅助视图控制')}>
        <Row label={tr('canvasConfig.showGrid', '显示画布网格')}>
          <Toggle checked={!!config.showGrid} onChange={v => set('showGrid', v)} />
        </Row>
        <Row label={tr('canvasConfig.showBleed', '显示 5% 出血安全边距')}>
          <Toggle checked={!!config.showSafeMargin} onChange={v => set('showSafeMargin', v)} />
        </Row>
        <Row label={tr('canvasConfig.showRuleOfThirds', '显示三分构图辅助网格')}>
          <Toggle checked={!!config.showGridOverlay} onChange={v => set('showGridOverlay', v)} />
        </Row>
      </Section>
    </div>
  )
}
