import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Pencil, Trash2, Folder, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [templatePreferences, setTemplatePreferences] = useState<TemplatePreferences>(() => loadTemplatePreferences())
  const [templateContextMenu, setTemplateContextMenu] = useState<{ x: number; y: number; template: PresetTemplate } | null>(null)
  
  // Track expanded state for each folder directory (default: expanded)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    festival: true,
    ecommerce: true,
    guochao: true,
    recruitment: true,
    food: true,
    other: true,
  })

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

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const visibleTemplates = useMemo(
    () => getVisibleTemplates(templatePreferences),
    [templatePreferences],
  )

  const categorizedTemplates = useMemo(() => {
    let list = visibleTemplates
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.categoryName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }

    const result = TEMPLATE_CATEGORIES.map((cat) => {
      const items = list.filter((t) => t.categoryId === cat.id)
      return {
        id: cat.id,
        name: cat.name,
        items,
      }
    })

    const knownCatIds = new Set(TEMPLATE_CATEGORIES.map((c) => c.id))
    const uncategorized = list.filter((t) => !knownCatIds.has(t.categoryId))
    if (uncategorized.length > 0) {
      result.push({
        id: 'other',
        name: tr('template.otherCategory', '其他模板'),
        items: uncategorized,
      })
    }

    return result
  }, [searchFilter, visibleTemplates, t])

  const totalFilteredCount = useMemo(() => {
    return categorizedTemplates.reduce((acc, cat) => acc + cat.items.length, 0)
  }, [categorizedTemplates])

  const isAllExpanded = useMemo(() => {
    return categorizedTemplates.every((cat) => expandedFolders[cat.id] !== false)
  }, [categorizedTemplates, expandedFolders])

  const toggleAllFolders = () => {
    const nextState = !isAllExpanded
    const updated: Record<string, boolean> = {}
    categorizedTemplates.forEach((cat) => {
      updated[cat.id] = nextState
    })
    setExpandedFolders((prev) => ({ ...prev, ...updated }))
  }

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
    feedback.notify({
      title: tr('template.appliedTitle', '使用模板成功'),
      description: `已载入「${tpl.name}」画布预设与图元`,
      tone: 'success',
    })
  }

  const handleOpenTemplate = (tpl: PresetTemplate) => {
    const store = useEditorStore.getState()
    store.setCurrentSceneId(null)
    store.setEditingTemplateId(tpl.id)
    store.setCanvasConfig({ ...tpl.canvasConfig, lockPan: false, lockZoom: false })
    store.setProjectName(tpl.name)
    store.setProjectCategory(tpl.categoryName)
    store.setElements(cloneTemplateElements(tpl))
    store.setActiveIds([])
    cmdManager.clear()
    window.history.pushState(null, '', `?template=${encodeURIComponent(tpl.id)}`)
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
    feedback.notify({ title: '模板已删除', description: tpl.name, tone: 'success' })
  }

  return (
    <div className="flex flex-col w-full h-full pb-2">
      {/* Directory Folders Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{tr('template.folderGallery', '模板目录库')}</span>
          <span className="text-[10px] text-muted-foreground font-mono">({totalFilteredCount})</span>
        </div>
        <button
          type="button"
          onClick={toggleAllFolders}
          className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border/60 bg-card hover:bg-muted cursor-pointer select-none"
        >
          {isAllExpanded ? tr('template.collapseAll', '全部折叠') : tr('template.expandAll', '全部展开')}
        </button>
      </div>

      {/* Template Directory Folders List */}
      <div className="flex-1 px-2 pb-2 pt-0 overflow-y-auto space-y-2">
        {totalFilteredCount === 0 ? (
          <div className="text-center text-editor-text-dim text-xs py-8">
            {tr('template.noMatch', '未找到相关海报模板')}
          </div>
        ) : (
          categorizedTemplates.map((cat) => {
            const isExpanded = expandedFolders[cat.id] !== false
            const hasItems = cat.items.length > 0

            if (!hasItems && searchFilter.trim()) return null

            return (
              <div key={cat.id} className="border border-border/70 rounded-lg bg-card/60 shadow-2xs flex flex-col">
                {/* Category Directory Header */}
                <div
                  onClick={() => toggleFolder(cat.id)}
                  className="sticky top-0 z-20 flex items-center justify-between px-3 py-2 text-xs font-bold cursor-pointer transition-colors select-none bg-card hover:bg-muted/80 border-b border-border/40 rounded-t-lg shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground text-[11px] shrink-0">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-foreground text-xs font-bold truncate">{cat.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full border border-border/40">
                      {cat.items.length}
                    </span>
                  </div>
                </div>

                {/* Directory Template Item Cards (Expanded) */}
                {isExpanded && (
                  <div className="p-2 space-y-3 bg-muted/10 rounded-b-lg">
                    {!hasItems ? (
                      <div className="text-center text-muted-foreground text-[11px] py-3 italic">
                        {tr('template.noMatchInFolder', '此目录下暂无匹配模板')}
                      </div>
                    ) : (
                      cat.items.map((tpl) => (
                        <div
                          key={tpl.id}
                          onDoubleClick={() => handleOpenTemplate(tpl)}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setTemplateContextMenu({ x: event.clientX, y: event.clientY, template: tpl })
                          }}
                          className="group relative bg-card border border-border hover:border-purple-500 rounded-lg overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                        >
                          {/* Thumbnail */}
                          <div className="relative w-full overflow-hidden bg-slate-950">
                            <CanvasThumbnail
                              snapshot={{ canvasConfig: tpl.canvasConfig, elements: tpl.elements }}
                              emptyLabel={tr('template.previewEmpty', '空白模板')}
                              height={170}
                            />
                            <div className="pointer-events-none absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                              {tpl.categoryName}
                            </div>

                            {/* Hover Quick Action Buttons (2 buttons vertical stack) */}
                            <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 p-3 backdrop-blur-[2px]">
                              <button
                                type="button"
                                onClick={() => handleApplyTemplate(tpl)}
                                className="w-full max-w-[150px] py-1.5 px-3 text-xs font-bold bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-md shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="whitespace-nowrap">{tr('template.useTemplate', '使用模板')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenTemplate(tpl)}
                                className="w-full max-w-[150px] py-1.5 px-3 text-xs font-bold bg-slate-800/90 hover:bg-slate-700 active:bg-slate-900 text-slate-100 border border-slate-600/60 rounded-md shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-blue-400" />
                                <span className="whitespace-nowrap">{tr('template.openEdit', '打开编辑')}</span>
                              </button>
                            </div>
                          </div>

                          {/* Info Footer */}
                          <div className="p-2 bg-card flex flex-col gap-0.5 border-t border-border/40">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground truncate">{tpl.name}</span>
                              <span className="text-[9px] text-muted-foreground font-mono shrink-0 ml-1">
                                {tpl.canvasConfig.width}x{tpl.canvasConfig.height}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate">{tpl.description}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

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
