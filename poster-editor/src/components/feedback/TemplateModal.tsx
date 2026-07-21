import { useState, useMemo } from 'react'
import { LayoutTemplate, Eye, Sparkles, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PRESET_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PresetTemplate,
} from '@/lib/presetTemplates'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

interface TemplateModalProps {
  open: boolean
  onClose: () => void
}

export function TemplateModal({ open, onClose }: TemplateModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<PresetTemplate | null>(null)
  const feedback = useFeedback()
  const setCanvasConfig = useEditorStore((state) => state.setCanvasConfig)
  const setElements = useEditorStore((state) => state.setElements)

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return PRESET_TEMPLATES
    return PRESET_TEMPLATES.filter((t) => t.categoryId === activeCategory)
  }, [activeCategory])

  if (!open) return null

  const setProjectName = useEditorStore((state) => state.setProjectName)

  const handleApplyTemplate = (tpl: PresetTemplate) => {
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

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-purple-500" />
            <span className="text-base font-bold text-foreground">海报模板库 - 分类模版全集</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono font-bold">
              {PRESET_TEMPLATES.length} 款内置海报
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
            全部分类 ({PRESET_TEMPLATES.length})
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => {
            const count = PRESET_TEMPLATES.filter((t) => t.categoryId === cat.id).length
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
              <div
                className="w-full aspect-[2/3] relative flex items-center justify-center p-4 transition-transform group-hover:scale-[1.02]"
                style={{ background: tpl.coverBg }}
              >
                <div className="text-center space-y-2 pointer-events-none drop-shadow-md">
                  <span className="inline-block px-2.5 py-1 text-[10px] font-bold text-white bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                    {tpl.categoryName}
                  </span>
                  <div className="text-lg font-black text-white px-2 leading-tight drop-shadow-lg">
                    {tpl.name}
                  </div>
                </div>

                {/* Action Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
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
            <div
              className="w-full aspect-[2/3] max-h-[380px] rounded-lg border border-border flex flex-col items-center justify-center p-6 shadow-inner relative overflow-hidden"
              style={{ background: previewTemplate.coverBg }}
            >
              <div className="text-center space-y-3 drop-shadow-xl">
                <span className="px-3 py-1 text-xs font-bold text-white bg-black/50 rounded-full border border-white/20">
                  {previewTemplate.categoryName}
                </span>
                <div className="text-2xl font-black text-white leading-tight drop-shadow-2xl">
                  {previewTemplate.name}
                </div>
                <div className="text-xs text-white/80 max-w-xs mx-auto">
                  包含 {previewTemplate.elements.length} 个图元组件（标题、图形、动态二维码/条码）
                </div>
              </div>
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
                onClick={() => handleApplyTemplate(previewTemplate)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                载入并转换为我的海报场景
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
