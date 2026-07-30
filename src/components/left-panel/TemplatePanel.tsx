import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Sparkles, X, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TEMPLATE_CATEGORIES,
  type PresetTemplate,
} from '@/lib/presetTemplates'
import { cmdManager, useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { ListContextMenu } from '@/components/ui/list-context-menu'
import { CanvasThumbnail } from './CanvasThumbnail'
import {
  getVisibleTemplates,
  loadTemplatePreferences,
  saveTemplatePreferences,
  TEMPLATE_PREFERENCES_UPDATED_EVENT,
  type TemplatePreferences,
} from '@/lib/templatePreferences'

export function TemplatePanel({ searchFilter = '' }: { searchFilter?: string }) {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [previewTemplate, setPreviewTemplate] = useState<PresetTemplate | null>(null)
  const [templatePreferences, setTemplatePreferences] = useState<TemplatePreferences>(() => loadTemplatePreferences())
  const [templateContextMenu, setTemplateContextMenu] = useState<{ x: number; y: number; template: PresetTemplate } | null>(null)
  const feedback = useFeedback()
  const setCanvasConfig = useEditorStore((state) => state.setCanvasConfig)
  const setElements = useEditorStore((state) => state.setElements)
  const setProjectName = useEditorStore((state) => state.setProjectName)

  useEffect(() => {
    const refreshPreferences = () => setTemplatePreferences(loadTemplatePreferences())
    window.addEventListener(TEMPLATE_PREFERENCES_UPDATED_EVENT, refreshPreferences)
    return () => window.removeEventListener(TEMPLATE_PREFERENCES_UPDATED_EVENT, refreshPreferences)
  }, [])

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  const filteredTemplates = useMemo(() => {
    let list = getVisibleTemplates(templatePreferences)
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
  }, [activeCategory, searchFilter, templatePreferences])

  const visibleTemplates = useMemo(
    () => getVisibleTemplates(templatePreferences),
    [templatePreferences],
  )

  const updateTemplatePreferences = (next: TemplatePreferences) => {
    setTemplatePreferences(next)
    saveTemplatePreferences(next)
  }

  const cloneTemplateElements = (tpl: PresetTemplate) => tpl.elements.map((el) => ({
    ...el,
    id: `${el.type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }))

  const handleApplyTemplate = (tpl: PresetTemplate) => {
    const store = useEditorStore.getState()
    store.setEditingTemplateId(null)
    setCanvasConfig(tpl.canvasConfig)
    setProjectName(tpl.name)
    setElements(cloneTemplateElements(tpl))
    setPreviewTemplate(null)
  }

  const handleOpenTemplate = (tpl: PresetTemplate) => {
    const store = useEditorStore.getState()
    // Template editing is a separate draft and must not create or overwrite a scene.
    store.setCurrentSceneId(null)
    store.setEditingTemplateId(tpl.id)
    store.setCanvasConfig({ ...tpl.canvasConfig, lockPan: false, lockZoom: false })
    store.setProjectName(tpl.name)
    store.setProjectCategory(tpl.categoryName)
    store.setElements(cloneTemplateElements(tpl))
    store.setActiveIds([])
    cmdManager.clear()
    window.history.pushState(null, '', `?template=${encodeURIComponent(tpl.id)}`)
    setPreviewTemplate(null)
    feedback.notify({
      title: '模板已打开',
      description: `已载入「${tpl.name}」，现在可以继续编辑。`,
      tone: 'success',
    })
  }

  const handleRenameTemplate = async (tpl: PresetTemplate) => {
    const nextName = await feedback.prompt({
      title: '重命名模板',
      description: '请输入模板名称，名称只影响当前浏览器中的模板库。',
      defaultValue: tpl.name,
      placeholder: '模板名称',
      confirmLabel: '保存',
      cancelLabel: '取消',
      tone: 'info',
      validate: (value) => (value.trim() ? null : '名称不能为空'),
    })
    if (!nextName || nextName.trim() === tpl.name) return
    updateTemplatePreferences({
      ...templatePreferences,
      names: { ...templatePreferences.names, [tpl.id]: nextName.trim() },
    })
    feedback.notify({ title: '模板名称已更新', description: nextName.trim(), tone: 'success' })
  }

  const handleDeleteTemplate = async (tpl: PresetTemplate) => {
    const confirmed = await feedback.confirm({
      title: '删除模板',
      description: `确定要从模板库中移除「${tpl.name}」吗？`,
      confirmLabel: '删除',
      cancelLabel: '取消',
      tone: 'warning',
    })
    if (!confirmed) return
    updateTemplatePreferences({
      ...templatePreferences,
      deletedIds: [...new Set([...templatePreferences.deletedIds, tpl.id])],
    })
    if (previewTemplate?.id === tpl.id) setPreviewTemplate(null)
    feedback.notify({ title: '模板已删除', description: tpl.name, tone: 'success' })
  }

  return (
    <div className="flex flex-col w-full h-full pb-4">
      {/* Template asset usage notice */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-800/40 text-[10px] text-emerald-400 font-bold shrink-0">
        <span className="flex items-center gap-1 truncate">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          {tr('template.copyrightNotice', '示例模板素材用于演示，正式商用前请核验授权')}
        </span>
      </div>
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
          {tr('template.allCategories', '全部')} ({visibleTemplates.length})
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => {
          const count = visibleTemplates.filter((t) => t.categoryId === cat.id).length
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
          <div className="text-center text-editor-text-dim text-xs py-8">{tr('template.noMatch', '未找到相关海报模板')}</div>
        ) : (
          filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onDoubleClick={() => handleOpenTemplate(tpl)}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setTemplateContextMenu({ x: event.clientX, y: event.clientY, template: tpl })
              }}
              className="group relative bg-card border border-border hover:border-purple-500 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Real Leafer template preview, shared with scene thumbnails */}
              <div className="relative w-full overflow-hidden bg-slate-950">
                <CanvasThumbnail
                  snapshot={{ canvasConfig: tpl.canvasConfig, elements: tpl.elements }}
                  emptyLabel={tr('template.previewEmpty', '空白模板')}
                  height={180}
                />
                <div className="pointer-events-none absolute left-2 top-2 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                  {tpl.categoryName}
                </div>

                {/* Hover Quick Action Buttons */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => handleOpenTemplate(tpl)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded shadow hover:bg-blue-500 flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    打开编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTemplate(tpl)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white text-slate-900 rounded shadow hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3 text-purple-600" />
                    {tr('template.previewBtn', '预览')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 text-[11px] font-bold bg-purple-600 text-white rounded shadow hover:bg-purple-500 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {tr('template.useTemplate', '使用模板')}
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
                <span className="font-bold text-xs text-foreground">{tr('template.previewTitle', '海报模板预览')} - {previewTemplate.name}</span>
              </div>
              <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={() => setPreviewTemplate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview Box */}
            <div
              className="w-full max-h-[320px] rounded-lg border border-border shadow-inner relative overflow-hidden"
            >
              <CanvasThumbnail
                snapshot={{ canvasConfig: previewTemplate.canvasConfig, elements: previewTemplate.elements }}
                emptyLabel={tr('template.previewEmpty', '空白模板')}
                height={320}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{tr('template.dimensions', '规格')}: {previewTemplate.canvasConfig.width} x {previewTemplate.canvasConfig.height} px</span>
              <span>{tr('template.elements', '图元')}: {previewTemplate.elements.length}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)} className="text-xs">
                {tr('common.cancel', '返回')}
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

      {templateContextMenu && (
        <ListContextMenu
          pos={templateContextMenu}
          onClose={() => setTemplateContextMenu(null)}
          actions={[
            {
              label: '打开编辑',
              icon: Pencil,
              tone: 'accent',
              onClick: () => handleOpenTemplate(templateContextMenu.template),
            },
            {
              label: '应用到场景',
              icon: Sparkles,
              tone: 'accent',
              onClick: () => handleApplyTemplate(templateContextMenu.template),
            },
            {
              label: '重命名模板',
              icon: Pencil,
              onClick: () => { void handleRenameTemplate(templateContextMenu.template) },
            },
            {
              label: '删除模板',
              icon: Trash2,
              tone: 'danger',
              onClick: () => { void handleDeleteTemplate(templateContextMenu.template) },
            },
          ]}
        />
      )}
    </div>
  )
}
