import { useState, useMemo } from 'react'
import { Eye, Sparkles, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  PRESET_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type PresetTemplate,
} from '@/lib/presetTemplates'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

export function TemplatePanel({ searchFilter = '' }: { searchFilter?: string }) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<PresetTemplate | null>(null)
  const feedback = useFeedback()
  const setCanvasConfig = useEditorStore((state) => state.setCanvasConfig)
  const setElements = useEditorStore((state) => state.setElements)

  const filteredTemplates = useMemo(() => {
    let list = PRESET_TEMPLATES
    if (activeCategory !== 'all') {
      list = list.filter((t) => t.categoryId === activeCategory)
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeCategory, searchFilter])

  const setProjectName = useEditorStore((state) => state.setProjectName)

  const handleApplyTemplate = (tpl: PresetTemplate) => {
    setCanvasConfig(tpl.canvasConfig)
    setProjectName(tpl.name)
    const clonedElements = tpl.elements.map((el) => ({
      ...el,
      id: `${el.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }))
    setElements(clonedElements)

    feedback.notify({
      title: `正载入海报模板「${tpl.name}」`,
      description: '已在主画布载入模板组件！右键点击画布选择「转为场景」即可另存存入页面目录',
      tone: 'success',
    })
    setPreviewTemplate(null)
  }

  return (
    <div className="flex flex-col w-full h-full pb-4">
      {/* Category Folders Filter */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-b border-border/60 bg-muted/20 shrink-0">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          全部 ({PRESET_TEMPLATES.length})
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = PRESET_TEMPLATES.filter((t) => t.categoryId === cat.id).length
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Template Cards List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {filteredTemplates.length === 0 ? (
          <div className="text-center text-editor-text-dim text-xs py-8">未找到相关海报模板</div>
        ) : (
          filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group relative bg-card border border-border hover:border-purple-500 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Cover Card */}
              <div
                className="w-full aspect-[16/9] relative flex items-center justify-center p-3 overflow-hidden"
                style={{ background: tpl.coverBg }}
              >
                <div className="text-center space-y-1 pointer-events-none drop-shadow-md">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold text-white bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                    {tpl.categoryName}
                  </span>
                  <div className="text-sm font-black text-white px-2 leading-tight drop-shadow">
                    {tpl.name}
                  </div>
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tpl)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-900 rounded shadow hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-purple-600" />
                    预览
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-purple-600 text-white rounded shadow hover:bg-purple-500 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    使用模板
                  </button>
                </div>
              </div>

              {/* Info Footer */}
              <div className="p-2 bg-card flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground truncate">{tpl.name}</span>
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {tpl.canvasConfig.width}x{tpl.canvasConfig.height}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{tpl.description}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Template Detail Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5 overflow-hidden flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-xs text-foreground">海报模板预览 - {previewTemplate.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setPreviewTemplate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview Box */}
            <div
              className="w-full aspect-[2/3] max-h-[320px] rounded-lg border border-border flex flex-col items-center justify-center p-4 shadow-inner relative overflow-hidden"
              style={{ background: previewTemplate.coverBg }}
            >
              <div className="text-center space-y-2 drop-shadow-xl">
                <span className="px-2.5 py-0.5 text-[10px] font-bold text-white bg-black/50 rounded-full border border-white/20">
                  {previewTemplate.categoryName}
                </span>
                <div className="text-xl font-black text-white leading-tight drop-shadow-2xl">
                  {previewTemplate.name}
                </div>
                <div className="text-[11px] text-white/80 max-w-xs mx-auto">
                  包含 {previewTemplate.elements.length} 个图元组件
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>规格: {previewTemplate.canvasConfig.width} x {previewTemplate.canvasConfig.height} px</span>
              <span>图元: {previewTemplate.elements.length} 个</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)} className="text-xs">
                返回
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApplyTemplate(previewTemplate)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                载入此模板场景
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
