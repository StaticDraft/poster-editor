import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Undo2,
  Redo2,
  Trash2,
  Save,
  Play,
  Download,
  Languages,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Group,
  Ungroup,
  Image as ImageIcon,
  FolderOpen,
  MoreHorizontal,
  ChevronDown,
  FileJson,
  LayoutTemplate,
} from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useFeedback } from '@/lib/feedback'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'
import { exportTemplatePackage, importTemplatePackage } from '@/lib/templatePack'
import { ExportModal } from '@/components/feedback/ExportModal'
import { TemplateModal } from '@/components/feedback/TemplateModal'

export function TopToolbar() {
  const { t, i18n } = useTranslation()
  const [showExportModal, setShowExportModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const activeIds = useEditorStore((state) => state.activeIds)
  const updateNodes = useEditorStore((state) => state.updateNodes)
  const clearNodes = useEditorStore((state) => state.clearNodes)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)
  const alignNodes = useEditorStore((state) => state.alignNodes)
  const elements = useEditorStore((state) => state.elements)
  const feedback = useFeedback()

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  const handleGroup = () => {
    if (activeIds.length < 2) return
    const groupId = `group-${Date.now()}`
    updateNodes(activeIds, { groupId })
    useEditorStore.getState().setSidebarTab('structure')
  }

  const handleUngroup = () => {
    if (activeIds.length === 0) return
    updateNodes(activeIds, { groupId: undefined })
  }

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark') || false
  )

  const handleClearCanvas = async () => {
    const confirmed = await feedback.confirm({
      title: tr('toolbar.clear', '清空设计'),
      description: tr('toolbar.clearConfirm', '您即将清空当前画布上的所有元素。'),
      confirmLabel: tr('common.clear', '确认清空'),
      cancelLabel: tr('common.cancel', '取消'),
      tone: 'warning',
    })
    if (!confirmed) return
    clearNodes()
    feedback.notify({
      title: tr('toolbar.clear', '已清空'),
      description: tr('toolbar.clearSuccess', '画布清空完成'),
      tone: 'success',
    })
  }

  const handleSaveScene = () => {
    useEditorStore.getState().saveScene()
    const state = useEditorStore.getState()
    markSaved(buildEditorSaveFingerprint({
      currentSceneId: state.currentSceneId,
      projectName: state.projectName,
      projectCategory: state.projectCategory,
      canvasConfig: state.canvasConfig,
      elements: state.elements,
    }))
    feedback.notify({
      title: tr('canvasConfig.saved', '海报已保存'),
      tone: 'success',
    })
  }

  const handleStartPreview = () => {
    const state = useEditorStore.getState()
    localStorage.setItem('poster_preview_snapshot', JSON.stringify({
      elements: state.elements,
      canvasConfig: state.canvasConfig,
    }))
    const previewWindow = window.open('/preview', '_blank', 'width=800,height=900,menubar=no,toolbar=no,location=no,status=no')
    if (previewWindow) {
      feedback.notify({
        title: tr('toolbar.startPreview', '启动预览'),
        description: tr('toolbar.previewToast', '预览已启动'),
        tone: 'success',
      })
    } else {
      feedback.notify({
        title: tr('toolbar.previewBlocked', '预览被拦截'),
        description: tr('toolbar.previewBlockedDesc', '浏览器阻止了预览弹窗。'),
        tone: 'error',
      })
    }
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements))
    const a = document.createElement("a")
    a.href = dataStr
    a.download = `${useEditorStore.getState().projectName || 'poster'}_schema.json`
    a.click()
    feedback.notify({
      title: tr('toolbar.export', '导出 JSON'),
      description: tr('topToolbar.exportToast', '工程数据包已下载'),
      tone: 'success',
    })
  }

  const toggleTheme = () => {
    const nextTheme = !isDark
    if (nextTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setIsDark(nextTheme)
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('zh') ? 'en' : 'zh')
  }

  return (
    <div className="flex w-full h-11 shrink-0 items-center justify-between bg-card text-card-foreground shadow-sm px-3 border-b border-border overflow-x-auto no-scrollbar">
      {/* Brand logo & title */}
      <div className="font-bold flex items-center gap-2 tracking-tight shrink-0">
        <div className="flex items-center justify-center bg-gradient-to-tr from-rose-500 via-pink-500 to-violet-600 text-white w-7 h-7 rounded-lg shadow-md shrink-0">
          <span className="font-extrabold text-xs">Pd</span>
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mr-2 hidden sm:inline text-xs">
          {t('header.title')}
        </span>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5 bg-muted/30 px-1 py-0.5 rounded-lg border border-border shrink-0">
        <Button variant="ghost" size="icon" className="w-7 h-7" title={t('toolbar.zoomOut')} onClick={() => useEditorStore.getState().zoomOut()}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-[11px] font-mono font-bold text-muted-foreground hover:text-foreground px-1.5 min-w-[44px] text-center flex items-center justify-center gap-0.5 rounded hover:bg-muted/50 py-1 transition-colors">
              {t('toolbar.zoomReset')}
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1 bg-card border border-border shadow-xl z-50">
            <button
              onClick={() => {
                const app = useEditorStore.getState()._leaferApp
                if (app?.tree) app.tree.zoom(0.5)
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-xs text-foreground hover:bg-muted rounded font-mono"
            >
              <span>50%</span>
            </button>
            <button
              onClick={() => {
                const app = useEditorStore.getState()._leaferApp
                if (app?.tree) app.tree.zoom(0.75)
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-xs text-foreground hover:bg-muted rounded font-mono"
            >
              <span>75%</span>
            </button>
            <button
              onClick={() => useEditorStore.getState().zoomReset()}
              className="flex w-full items-center justify-between px-2 py-1 text-xs text-foreground hover:bg-muted rounded font-mono font-bold"
            >
              <span>100%</span>
            </button>
            <button
              onClick={() => {
                const app = useEditorStore.getState()._leaferApp
                if (app?.tree) app.tree.zoom(1.25)
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-xs text-foreground hover:bg-muted rounded font-mono"
            >
              <span>125%</span>
            </button>
            <button
              onClick={() => {
                const app = useEditorStore.getState()._leaferApp
                if (app?.tree) app.tree.zoom(1.5)
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-xs text-foreground hover:bg-muted rounded font-mono"
            >
              <span>150%</span>
            </button>
            <button
              onClick={() => {
                const app = useEditorStore.getState()._leaferApp
                if (app?.tree) app.tree.zoom(2.0)
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-xs text-foreground hover:bg-muted rounded font-mono"
            >
              <span>200%</span>
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => useEditorStore.getState().zoomFit()}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-xs text-purple-400 font-bold hover:bg-purple-500/10 rounded"
            >
              <Maximize2 className="w-3 h-3" />
              自适应居中
            </button>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="w-7 h-7" title={t('toolbar.zoomIn')} onClick={() => useEditorStore.getState().zoomIn()}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-3.5 bg-border mx-0.5" />
        <Button variant="ghost" size="icon" className="w-7 h-7" title={t('toolbar.zoomFit')} onClick={() => useEditorStore.getState().zoomFit()}>
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={toggleLanguage} title={t('toolbar.lang')}>
          <Languages className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={toggleTheme} title={t('toolbar.theme')}>
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={undo} disabled={!canUndo}>
          <Undo2 className="w-3.5 h-3.5 mr-1" /> {tr('toolbar.undo', '撤销')}
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={redo} disabled={!canRedo}>
          <Redo2 className="w-3.5 h-3.5 mr-1" /> {tr('toolbar.redo', '重做')}
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Group / Ungroup */}
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleGroup} disabled={activeIds.length < 2} title={tr('toolbar.group', '编组')}>
          <Group className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleUngroup} disabled={activeIds.length === 0} title={tr('toolbar.ungroup', '解组')}>
          <Ungroup className="w-3.5 h-3.5" />
        </Button>

        {/* Align & Distribute Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              disabled={activeIds.length < 2}
            >
              <AlignLeft className="w-3.5 h-3.5 mr-1 text-blue-500" />
              <span className="hidden md:inline">{tr('toolbar.align', '对齐分布')}</span>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-card border border-border shadow-xl z-50">
            <div className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1.5">{tr('toolbar.alignHeader', '图层对齐与分布')}</div>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('left')}><AlignLeft className="w-3.5 h-3.5 mr-1.5 text-blue-500" />{tr('toolbar.left', '左对齐')}</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('center')}><AlignCenter className="w-3.5 h-3.5 mr-1.5 text-blue-500" />{tr('toolbar.center', '居中')}</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('right')}><AlignRight className="w-3.5 h-3.5 mr-1.5 text-blue-500" />{tr('toolbar.right', '右对齐')}</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('top')}><AlignVerticalJustifyStart className="w-3.5 h-3.5 mr-1.5 text-blue-500" />{tr('toolbar.top', '顶对齐')}</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('middle')}><AlignVerticalJustifyCenter className="w-3.5 h-3.5 mr-1.5 text-blue-500" />{tr('toolbar.middle', '垂直居中')}</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('bottom')}><AlignVerticalJustifyEnd className="w-3.5 h-3.5 mr-1.5 text-blue-500" />{tr('toolbar.bottom', '底对齐')}</Button>
            </div>
            <div className="border-t border-border pt-1.5 grid grid-cols-2 gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('distribute-x')} disabled={activeIds.length < 3}><AlignHorizontalSpaceAround className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />{tr('toolbar.distributeX', '水平分布')}</Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] justify-start px-2" onClick={() => alignNodes('distribute-y')} disabled={activeIds.length < 3}><AlignVerticalSpaceAround className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />{tr('toolbar.distributeY', '垂直分布')}</Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-4 bg-border mx-0.5" />

        {/* Primary Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 border-blue-500/30 hover:bg-blue-500/10"
          onClick={handleSaveScene}
        >
          <Save className="w-3.5 h-3.5 mr-1 text-blue-500" /> {tr('canvasConfig.save', '保存')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 border-green-500/30 hover:bg-green-500/10 text-green-600"
          onClick={handleStartPreview}
        >
          <Play className="w-3.5 h-3.5 mr-1 fill-current text-green-500" /> {tr('toolbar.startPreview', '预览')}
        </Button>

        {/* CTA 1: Open Preset Template Library */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplateModal(true)}
          className="h-7 text-xs px-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 font-semibold shrink-0"
        >
          <LayoutTemplate className="w-3.5 h-3.5 mr-1" /> 模板库
        </Button>

        {/* Primary CTA: Export Image */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowExportModal(true)}
          className="h-7 text-xs px-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md shrink-0"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1" /> {tr('toolbar.exportImage', '导出图片')}
        </Button>

        {/* Secondary Operations Popover / More Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="w-7 h-7 shrink-0" title={tr('toolbar.more', '更多')}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5 bg-card border border-border shadow-xl z-50">
            <button
              onClick={exportTemplatePackage}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground rounded hover:bg-muted transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              {tr('toolbar.exportTemplate', '导出工程模板 (.poster)')}
            </button>

            <label className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground rounded hover:bg-muted cursor-pointer transition-colors">
              <input
                type="file"
                accept=".poster,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const ok = await importTemplatePackage(file)
                    if (ok) {
                      feedback.notify({
                        title: tr('toolbar.importSuccess', '模板导入成功'),
                        tone: 'success',
                      })
                    }
                  } catch (err) {
                    feedback.notify({
                      title: tr('toolbar.importFailed', '模板文件解析失败'),
                      tone: 'error',
                    })
                  }
                  e.target.value = ''
                }}
              />
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              {tr('toolbar.importTemplate', '导入工程模板 (.poster)')}
            </label>

            <button
              onClick={handleExportJSON}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground rounded hover:bg-muted transition-colors"
            >
              <FileJson className="w-3.5 h-3.5 text-slate-400" />
              {tr('toolbar.exportJSON', '导出图层 JSON')}
            </button>

            <div className="my-1 border-t border-border" />

            <button
              onClick={handleClearCanvas}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 rounded hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {tr('toolbar.clear', '清空画布')}
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <ExportModal open={showExportModal} onClose={() => setShowExportModal(false)} />
      <TemplateModal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} />
    </div>
  )
}
