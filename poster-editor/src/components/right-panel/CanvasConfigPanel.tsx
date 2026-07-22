import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore, CanvasConfig } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'
import { Save, CheckCircle } from 'lucide-react'

const STORAGE_KEY = 'poster_project'

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
    <div className="flex items-center justify-between mb-2">
      <span className="text-[11px] text-editor-text-label shrink-0 mr-2">{label}</span>
      <div className="flex-1 flex justify-end">{children}</div>
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
  const feedback = useFeedback()
  const config = useEditorStore(s => s.canvasConfig)
  const setCanvasConfig = useEditorStore(s => s.setCanvasConfig)
  const activeIds = useEditorStore(s => s.activeIds)
  const elements = useEditorStore(s => s.elements)
  const projectName = useEditorStore(s => s.projectName)
  const projectCategory = useEditorStore(s => s.projectCategory)
  const setProjectName = useEditorStore(s => s.setProjectName)
  const setProjectCategory = useEditorStore(s => s.setProjectCategory)
  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')

  // If a node is selected, this panel shouldn't render
  const activeNode = activeIds.length === 1 ? elements.find(e => e.id === activeIds[0]) : null
  if (activeNode) return null

  const set = (key: keyof CanvasConfig, val: any) => setCanvasConfig({ [key]: val })

  const handleSave = () => {
    const snapshot = {
      projectName,
      projectCategory,
      canvasConfig: config,
      elements,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
    markSaved(buildEditorSaveFingerprint({
      currentSceneId: useEditorStore.getState().currentSceneId,
      projectName,
      projectCategory,
      canvasConfig: config,
      elements,
    }))
    feedback.notify({
      title: tr('canvasConfig.saved', '海报工程已保存'),
      description: tr('canvasConfig.quickSaveHint', '海报样式设置已存储在本地。'),
      tone: 'success',
    })
  }

  return (
    <div className="flex flex-col text-editor-text w-full">
      <div className="px-4 py-3 border-b border-editor-darker text-xs font-bold text-editor-text">{tr('canvasConfig.title', '海报画布配置')}</div>

      {/* File operations */}
      <Section title={tr('canvasConfig.file', '工程文档')}>
        <Row label={tr('canvasConfig.fileName', '海报标题')}>
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="flex-1 text-xs bg-editor-deep border border-border rounded px-2 h-7 text-editor-text focus:outline-none focus:border-blue-500"
          />
        </Row>
        <Row label={tr('canvasConfig.category', '文档项目组')}>
          <input
            value={projectCategory}
            onChange={e => setProjectCategory(e.target.value)}
            className="flex-1 text-xs bg-editor-deep border border-border rounded px-2 h-7 text-editor-text-label focus:outline-none focus:border-blue-500"
          />
        </Row>
        {/* Save button */}
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-1 h-7 text-[11px] rounded transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
          >
            {saveStatus === 'saved'
              ? <><CheckCircle className="w-3 h-3" /> {t('canvasConfig.saved')}</>
              : <><Save className="w-3 h-3" /> {tr('canvasConfig.save', '本地保存')}</>}
          </button>
        </div>
        <div className="text-[9px] text-editor-text-dim mt-1 text-center">{tr('canvasConfig.quickSaveHint', 'Ctrl+S 快速存档')}</div>
      </Section>

      <Section title={tr('canvasConfig.canvasSize', '海报像素尺寸')}>
        <Row label="常见海报比例">
          <select
            onChange={e => {
              const val = e.target.value
              if (!val) return
              const [w, h] = val.split('x').map(Number)
              if (w && h) {
                setCanvasConfig({ width: w, height: h })
              }
            }}
            className="flex-1 text-xs bg-editor-deep border border-border text-editor-text text-xs rounded px-2 h-7 focus:outline-none focus:border-blue-500 bg-card"
          >
            <option value="">自定义尺寸</option>
            <option value="800x1200">手机长图海报 (9:16) - 800x1200</option>
            <option value="1200x1200">电商/小红书方图 (1:1) - 1200x1200</option>
            <option value="1920x1080">横版横幅 Banner (16:9) - 1920x1080</option>
            <option value="1080x1920">抖音故事大图 (9:16) - 1080x1920</option>
            <option value="500x500">迷你小卡片 (1:1) - 500x500</option>
          </select>
        </Row>
        <Row label="宽度 (W)">
          <NumInput value={config.width} onChange={v => set('width', v)} />
        </Row>
        <Row label="高度 (H)">
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
                  >纯色</button>
                  <button
                    onClick={() => setCanvasConfig({ bgColor: { type: 'linear', from: 'top', to: 'bottom', stops: ['#667eea', '#764ba2'] } })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isGradient ? 'bg-blue-600 text-white' : 'text-editor-text-label hover:text-editor-text'}`}
                  >渐变</button>
                  <button
                    onClick={() => setCanvasConfig({ bgColor: { type: 'image', url: '', mode: 'cover' } })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors ${isImage ? 'bg-blue-600 text-white' : 'text-editor-text-label hover:text-editor-text'}`}
                  >图片</button>
                </div>

                {/* Solid color */}
                {isSolid && (
                  <div className="flex items-center gap-2">
                    <input type="color" value={bg} onChange={e => setCanvasConfig({ bgColor: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs text-editor-text-label font-mono">{bg}</span>
                  </div>
                )}

                {/* Gradient */}
                {isGradient && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5 items-center">
                      <select value={bg.type} onChange={e => setCanvasConfig({ bgColor: { ...bg, type: e.target.value } })}
                        className="h-6 text-[10px] bg-editor-deep border border-border text-editor-text rounded px-1 focus:outline-none">
                        <option value="linear">线性</option>
                        <option value="radial">径向</option>
                      </select>
                      {bg.type === 'linear' && (
                        <select value={bg.from || 'top'} onChange={e => {
                          const dirMap: Record<string, string> = { top: 'bottom', left: 'right', 'top-left': 'bottom-right' }
                          setCanvasConfig({ bgColor: { ...bg, from: e.target.value, to: dirMap[e.target.value] || 'bottom' } })
                        }}
                          className="h-6 text-[10px] bg-editor-deep border border-border text-editor-text rounded px-1 focus:outline-none">
                          <option value="top">↓ 从上到下</option>
                          <option value="left">→ 从左到右</option>
                          <option value="top-left">↘ 对角线</option>
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

                {/* Image */}
                {isImage && (
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={bg.url || ''}
                      onChange={e => setCanvasConfig({ bgColor: { ...bg, url: e.target.value } })}
                      placeholder="https://images.unsplash.com/..."
                      className="h-7 text-xs bg-editor-deep border border-border text-editor-text rounded px-2 focus:outline-none focus:border-blue-500 w-full"
                    />
                    <select value={bg.mode || 'cover'} onChange={e => setCanvasConfig({ bgColor: { ...bg, mode: e.target.value } })}
                      className="h-6 text-[10px] bg-editor-deep border border-border text-editor-text rounded px-1 focus:outline-none">
                      <option value="cover">铺满裁剪 (Cover)</option>
                      <option value="contain">完整显示 (Contain)</option>
                      <option value="repeat">平铺重复 (Repeat)</option>
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setCanvasConfig({ bgColor: '#ffffff' })}
                  className="mt-2 w-full py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 border border-border rounded transition-colors"
                >
                  重置为默认纯白背景
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
          <Toggle checked={config.lockPan} onChange={v => set('lockPan', v)} />
        </Row>
        <Row label={tr('canvasConfig.lockZoom', '禁止滚轮缩放')}>
          <Toggle checked={config.lockZoom} onChange={v => set('lockZoom', v)} />
        </Row>
      </Section>

      <Section title={tr('canvasConfig.auxSettings', '辅助视图控制')}>
        <Row label={tr('canvasConfig.showGrid', '显示画布网格')}>
          <Toggle checked={config.showGrid} onChange={v => set('showGrid', v)} />
        </Row>
        <Row label="显示 5% 出血安全边距">
          <Toggle checked={!!config.showSafeMargin} onChange={v => set('showSafeMargin', v)} />
        </Row>
        <Row label="显示三分构图辅助网格">
          <Toggle checked={!!config.showGridOverlay} onChange={v => set('showGridOverlay', v)} />
        </Row>
      </Section>
    </div>
  )
}
