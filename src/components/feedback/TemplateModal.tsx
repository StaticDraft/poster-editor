import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Pencil, LayoutTemplate, X } from 'lucide-react'
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
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [templatePreferences, setTemplatePreferences] = useState<TemplatePreferences>(() => loadTemplatePreferences())
  const feedback = useFeedback()
  const setCanvasConfig = useEditorStore((state) => state.setCanvasConfig)
  const setElements = useEditorStore((state) => state.setElements)

  useEffect(() => {
    const refreshPreferences = () => {
      const next = loadTemplatePreferences()
      setTemplatePreferences(next)
    }
    window.addEventListener(TEMPLATE_PREFERENCES_UPDATED_EVENT, refreshPreferences)
    return () => window.removeEventListener(TEMPLATE_PREFERENCES_UPDATED_EVENT, refreshPreferences)
  }, [])

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  const filteredTemplates = useMemo(() => {
    const templates = getVisibleTemplates(templatePreferences)
    if (activeCategory === 'all') return templates
    return templates.filter((tpl) => tpl.categoryId === activeCategory)
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
    setCanvasConfig(tpl.canvasConfig)
    setProjectName(tpl.name)
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
    onClose()
  }

  const handleOpenTemplate = (tpl: PresetTemplate) => {
    const store = useEditorStore.getState()
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
                <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3 p-4 backdrop-blur-[2px]">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="w-40 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    {tr('template.useTemplate', '使用模板')}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenTemplate(tpl)}
                    className="w-40 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600/60 shadow-md"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    {tr('template.openEdit', '打开编辑')}
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
    </div>
  )
}
