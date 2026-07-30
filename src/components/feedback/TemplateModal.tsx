import { useState, useMemo, useEffect } from 'react'
import { LayoutTemplate, Eye, Sparkles, X, CheckCircle2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TEMPLATE_CATEGORIES,
  type PresetTemplate,
} from '@/lib/presetTemplates'
import { cmdManager, useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import {
  getVisibleTemplates,
  loadTemplatePreferences,
  TEMPLATE_PREFERENCES_UPDATED_EVENT,
  type TemplatePreferences,
} from '@/lib/templatePreferences'
import { CanvasThumbnail } from '@/components/left-panel/CanvasThumbnail'

interface TemplateModalProps {
  open: boolean
  onClose: () => void
}

export function TemplateModal({ open, onClose }: TemplateModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<PresetTemplate | null>(null)
  const [templatePreferences, setTemplatePreferences] = useState<TemplatePreferences>(() => loadTemplatePreferences())
  const feedback = useFeedback()
  const setCanvasConfig = useEditorStore((state) => state.setCanvasConfig)
  const setElements = useEditorStore((state) => state.setElements)

  useEffect(() => {
    const refreshPreferences = () => {
      // Keep the modal preview in sync after saving a template from the canvas.
      const next = loadTemplatePreferences()
      setTemplatePreferences(next)
    }
    window.addEventListener(TEMPLATE_PREFERENCES_UPDATED_EVENT, refreshPreferences)
    return () => window.removeEventListener(TEMPLATE_PREFERENCES_UPDATED_EVENT, refreshPreferences)
  }, [])

  const filteredTemplates = useMemo(() => {
    const templates = getVisibleTemplates(templatePreferences)
    if (activeCategory === 'all') return templates
    return templates.filter((t) => t.categoryId === activeCategory)
  }, [activeCategory, templatePreferences])

  const visibleTemplates = useMemo(
    () => getVisibleTemplates(templatePreferences),
    [templatePreferences],
  )

  if (!open) return null

  const setProjectName = useEditorStore((state) => state.setProjectName)

  const handleApplyTemplate = (tpl: PresetTemplate) => {
    const store = useEditorStore.getState()
    store.setEditingTemplateId(null)
    // 1. Update Canvas config & Project Name
    setCanvasConfig(tpl.canvasConfig)
    setProjectName(tpl.name)
    // 2. Clone elements to ensure fresh unique IDs
    const clonedElements = tpl.elements.map((el) => ({
      ...el,
      id: `${el.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }))
    setElements(clonedElements)

    feedback.notify({
      title: `正编辑海报模板「${tpl.name}」`,
      description: '已在主画布载入模板！右键点击画布选择「转为场景」即可保存至页面目录',
      tone: 'success',
    })
    setPreviewTemplate(null)
    onClose()
  }

  const handleOpenTemplate = (tpl: PresetTemplate) => {
    const store = useEditorStore.getState()
    // Template editing is a separate draft and must not create or overwrite a scene.
    store.setCurrentSceneId(null)
    store.setEditingTemplateId(tpl.id)
    store.setCanvasConfig({ ...tpl.canvasConfig, lockPan: false, lockZoom: false })
    store.setProjectName(tpl.name)
    store.setProjectCategory(tpl.categoryName)
    store.setElements(tpl.elements.map((el) => ({
      ...el,
      id: `${el.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    })))
    store.setActiveIds([])
    cmdManager.clear()
    window.history.pushState(null, '', `?template=${encodeURIComponent(tpl.id)}`)
    feedback.notify({ title: '模板已打开', description: `已载入「${tpl.name}」，现在可以继续编辑。`, tone: 'success' })
    setPreviewTemplate(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-purple-500" />
            <span className="text-base font-bold text-foreground">海报模板库 - 分类模版全集</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-bold">
              {visibleTemplates.length} 款内置海报
            </span>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Category Tab Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
              activeCategory === 'all'
                ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                : 'bg-muted/40 border-border text-foreground hover:bg-muted'
            }`}
          >
            全部分类 ({visibleTemplates.length})
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => {
            const count = visibleTemplates.filter((t) => t.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                }`}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Template Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-3 gap-5">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group relative flex flex-col bg-muted/20 border border-border hover:border-purple-500 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
            >
              {/* Cover Card */}
              <div className="relative w-full overflow-hidden bg-slate-950">
                <CanvasThumbnail
                  snapshot={{ canvasConfig: tpl.canvasConfig, elements: tpl.elements }}
                  emptyLabel="空白模板"
                  height={300}
                />
                <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                  {tpl.categoryName}
                </div>

                {/* Action Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenTemplate(tpl)}
                    className="w-36 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    打开编辑
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewTemplate(tpl)}
                    className="w-36 text-xs font-bold bg-white/90 hover:bg-white text-slate-900 shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-purple-600" />
                    预览海报细节
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-36 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    转换二次编辑
                  </Button>
                </div>
              </div>

              {/* Template Info Footer */}
              <div className="p-3 bg-card border-t border-border flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground truncate">{tpl.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {tpl.canvasConfig.width}x{tpl.canvasConfig.height}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground truncate">{tpl.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Detail Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in-0">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 overflow-hidden flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-sm text-foreground">海报模板预览 - {previewTemplate.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setPreviewTemplate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Large Preview Canvas Box */}
            <div className="w-full max-h-[380px] rounded-lg border border-border shadow-inner relative overflow-hidden">
              <CanvasThumbnail
                snapshot={{ canvasConfig: previewTemplate.canvasConfig, elements: previewTemplate.elements }}
                emptyLabel="空白模板"
                height={380}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>画布规格: {previewTemplate.canvasConfig.width} x {previewTemplate.canvasConfig.height} px</span>
              <span>图元组件: {previewTemplate.elements.length} 个</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)} className="text-xs">
                返回列表
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleOpenTemplate(previewTemplate)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                打开并编辑模板
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
