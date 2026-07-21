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
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Group,
  Ungroup,
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { Button } from '@/components/ui/button'
import { useFeedback } from '@/lib/feedback'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'
import { exportTemplatePackage, importTemplatePackage } from '@/lib/templatePack'

export function TopToolbar() {
  const { t, i18n } = useTranslation()
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

  const handleExportPNG = async () => {
    const app = useEditorStore.getState()._leaferApp
    if (!app) return
    try {
      // High-resolution Retina export with 2x scaling
      await app.tree.export(`${useEditorStore.getState().projectName || 'my_poster'}.png`, { screenshot: true, scale: 2 })
      
      // Gorgeous canvas-confetti particle spray
      const confetti = (await import('canvas-confetti')).default
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      })
      
      feedback.notify({
        title: tr('toolbar.exportImageSuccess', '海报导出成功'),
        description: tr('toolbar.exportImageSuccessDesc', '超清 PNG 图片已下载分发'),
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
      feedback.notify({
        title: tr('toolbar.exportImageFailed', '导出图片失败'),
        tone: 'error',
      })
    }
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
    <div className="flex w-full items-center justify-between bg-card text-card-foreground shadow-sm px-1 py-1.5 border-b border-border">
      <div className="font-bold flex items-center gap-3 tracking-tight">
        <div className="flex items-center justify-center bg-gradient-to-tr from-rose-500 via-pink-500 to-violet-600 text-white w-8 h-8 rounded-lg shadow-md">
          <span className="font-extrabold text-sm">Pd</span>
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mr-4">
          {t('header.title')}
        </span>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-0.5 bg-muted/30 px-1 py-0.5 rounded-lg border border-border">
        <Button variant="ghost" size="icon" className="w-7 h-7" title={t('toolbar.zoomOut')} onClick={() => useEditorStore.getState().zoomOut()}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <button onClick={() => useEditorStore.getState().zoomReset()} className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2 min-w-[46px] text-center">
          {t('toolbar.zoomReset')}
        </button>
        <Button variant="ghost" size="icon" className="w-7 h-7" title={t('toolbar.zoomIn')} onClick={() => useEditorStore.getState().zoomIn()}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button variant="ghost" size="icon" className="w-7 h-7" title={t('toolbar.zoomFit')} onClick={() => useEditorStore.getState().zoomFit()}>
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleLanguage} title={t('toolbar.lang')}>
          <Languages className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('toolbar.theme')}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo}>
          <Undo2 className="w-4 h-4 mr-1" /> {tr('toolbar.undo', '撤销')}
        </Button>
        <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo}>
          <Redo2 className="w-4 h-4 mr-1" /> {tr('toolbar.redo', '重做')}
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={handleGroup} disabled={activeIds.length < 2} title={tr('toolbar.group', '编组')}>
          <Group className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleUngroup} disabled={activeIds.length === 0} title={tr('toolbar.ungroup', '解组')}>
          <Ungroup className="w-4 h-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={() => alignNodes('left')} disabled={activeIds.length < 2} title={tr('toolbar.alignLeft', '左对齐')}><AlignLeft className="w-4 h-4 text-blue-500" /></Button>
        <Button variant="ghost" size="icon" onClick={() => alignNodes('center')} disabled={activeIds.length < 2} title={tr('toolbar.alignCenter', '居中对齐')}><AlignCenter className="w-4 h-4 text-blue-500" /></Button>
        <Button variant="ghost" size="icon" onClick={() => alignNodes('right')} disabled={activeIds.length < 2} title={tr('toolbar.alignRight', '右对齐')}><AlignRight className="w-4 h-4 text-blue-500" /></Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" onClick={() => alignNodes('distribute-x')} disabled={activeIds.length < 3} title={tr('toolbar.distributeX', '水平分布')}><AlignHorizontalSpaceAround className="w-4 h-4 text-emerald-500" /></Button>
        <Button variant="ghost" size="icon" onClick={() => alignNodes('distribute-y')} disabled={activeIds.length < 3} title={tr('toolbar.distributeY', '垂直分布')}><AlignVerticalSpaceAround className="w-4 h-4 text-emerald-500" /></Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="outline" size="sm" onClick={handleClearCanvas}>
          <Trash2 className="w-4 h-4 mr-1 text-destructive" /> {tr('toolbar.clear', '清空设计')}
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveScene}
          className="border-blue-500/30 hover:bg-blue-500/10"
        >
          <Save className="w-4 h-4 mr-1 text-blue-500" /> {tr('canvasConfig.save', '存工程')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartPreview}
          className="border-green-500/30 hover:bg-green-500/10 text-green-600"
        >
          <Play className="w-4 h-4 mr-1 fill-current text-green-500" /> {tr('toolbar.startPreview', '预览')}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleExportPNG}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md animate-pulse hover:animate-none"
        >
          <ImageIcon className="w-4 h-4 mr-1" /> {tr('toolbar.exportImage', '导出图片')}
        </Button>
        <Button variant="outline" size="sm" onClick={exportTemplatePackage} title={tr('toolbar.exportTemplateTitle', '导出工程模板包 (.poster)')}>
          <Download className="w-4 h-4 mr-1" /> {tr('toolbar.exportTemplate', '导出模板')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJSON} title={tr('toolbar.exportJSONTitle', '导出图层 JSON')}>
          <Download className="w-4 h-4 mr-1 text-slate-400" /> {tr('toolbar.exportJSON', 'JSON')}
        </Button>
        <label className="cursor-pointer">
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
          <Button variant="outline" size="sm" asChild>
            <span><FolderOpen className="w-4 h-4 mr-1 text-amber-400" /> {tr('toolbar.importTemplate', '导入模板')}</span>
          </Button>
        </label>
      </div>
    </div>
  )
}
