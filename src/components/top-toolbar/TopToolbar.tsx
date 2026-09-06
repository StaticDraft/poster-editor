import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Undo2,
  Redo2,
  Trash2,
  Save,
  Play,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  FolderOpen,
  FileJson,
  Command,
  ChevronDown,
  MoreHorizontal,
  Palette,
  Scaling,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { useLicenseStore } from '@/store/useLicenseStore'
import { useEditorStore } from '@/store/useEditorStore'
import { saveFileNativeOrBrowser } from '@/lib/fileSave'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useFeedback } from '@/lib/feedback'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'
import { exportTemplatePackage, importTemplatePackage } from '@/lib/templatePack'
import { ExportModal } from '@/components/feedback/ExportModal'
import { BatchExportModal } from '@/components/feedback/BatchExportModal'
import { ShortcutsDialog } from '@/components/feedback/ShortcutsDialog'
import { SettingsDialog } from '@/components/feedback/SettingsDialog'
import { COLOR_PALETTES, type ColorPalette } from '@/lib/colorPalettes'
import { CANVAS_PRESETS, type CanvasPreset } from '@/lib/canvasPresets'

export function TopToolbar() {
  const { t } = useTranslation()
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBatchExportModal, setShowBatchExportModal] = useState(false)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const clearNodes = useEditorStore((state) => state.clearNodes)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)
  const isLicensed = useLicenseStore((state) => state.isLicensed)
  const isTrial = useLicenseStore((state) => state.isTrial)
  const openLicenseModal = useLicenseStore((state) => state.openModal)
  const elements = useEditorStore((state) => state.elements)
  const feedback = useFeedback()

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

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
    const store = useEditorStore.getState()
    const isTemplate = Boolean(store.editingTemplateId)
    if (isTemplate) {
      store.saveTemplate()
    } else {
      store.saveScene()
    }
    const state = useEditorStore.getState()
    markSaved(buildEditorSaveFingerprint({
      currentSceneId: state.currentSceneId,
      editingTemplateId: state.editingTemplateId,
      projectName: state.projectName,
      projectCategory: state.projectCategory,
      canvasConfig: state.canvasConfig,
      elements: state.elements,
    }))
    feedback.notify({
      title: isTemplate ? '模板已保存' : tr('canvasConfig.saved', '海报已保存'),
      tone: 'success',
    })
  }

  const handleStartPreview = () => {
    const state = useEditorStore.getState()
    localStorage.setItem('poster_preview_snapshot', JSON.stringify({
      elements: state.elements,
      canvasConfig: state.canvasConfig,
    }))
    const isElectron = Boolean((window as any).electronAPI)
    const baseLocation = window.location.href.split('#')[0].split('?')[0]
    const previewUrl = isElectron ? `${baseLocation}?preview=1` : '/preview'
    const previewWindow = window.open(previewUrl, '_blank', 'width=800,height=900,menubar=no,toolbar=no,location=no,status=no')
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

  const handleExportJSON = async () => {
    const fileName = `${useEditorStore.getState().projectName || 'poster'}_schema.json`
    const jsonText = JSON.stringify(elements, null, 2)
    const success = await saveFileNativeOrBrowser({
      filename: fileName,
      data: jsonText,
      mimeType: 'application/json',
      filters: [{ name: 'JSON Project File', extensions: ['json'] }],
    })
    if (success) {
      feedback.notify({
        title: tr('toolbar.export', '导出 JSON'),
        description: tr('topToolbar.exportToast', '工程数据包已完成保存'),
        tone: 'success',
      })
    }
  }

  const handleApplyPalette = (palette: ColorPalette) => {
    const state = useEditorStore.getState()
    state.setCanvasConfig({ bgColor: palette.bg })
    const updates = state.elements
      .map((el) => {
        if (el.type === 'Text') {
          const isHeading = ((el as any).fontSize || (el.props as any)?.fontSize || 24) > 36
          return {
            id: el.id,
            attrs: {
              fill: isHeading ? palette.primary : palette.secondary,
            },
          }
        }
        if (['Rect', 'Circle', 'Star', 'Polygon'].includes(el.type)) {
          return {
            id: el.id,
            attrs: {
              fill: palette.accent,
              stroke: palette.primary,
            },
          }
        }
        return null
      })
      .filter(Boolean) as Array<{ id: string; attrs: any }>

    state.batchUpdateNodes(updates)
  }

  const handleApplyCanvasPreset = (preset: CanvasPreset) => {
    const state = useEditorStore.getState()
    state.setCanvasConfig({ width: preset.width, height: preset.height })
    setTimeout(() => {
      state.zoomFit()
    }, 50)
  }

  return (
    <div className="flex w-full h-11 shrink-0 items-center justify-between bg-card text-card-foreground shadow-sm px-3 border-b border-border overflow-x-auto no-scrollbar">
      {/* Brand logo & title */}
      <div className="font-bold flex items-center tracking-tight shrink-0">
        <span className="text-xs font-bold text-foreground mr-2">
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
        {/* Killer Feature 1: One-Click AI Color Palette Switcher */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold shrink-0"
              title={tr('toolbar.colorPalette', '一键配色')}
            >
              <Palette className="w-3.5 h-3.5 mr-1" />
              {tr('toolbar.colorPalette', '一键配色')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-card border border-border shadow-2xl z-50">
            <div className="text-xs font-bold text-foreground mb-2 px-1 flex items-center justify-between">
              <span>{tr('toolbar.colorPaletteHeader', '海报配色灵感方案')}</span>
              <span className="text-[10px] text-muted-foreground font-mono">6 Colors</span>
            </div>
            <div className="space-y-1.5">
              {COLOR_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => handleApplyPalette(pal)}
                  className="w-full p-1.5 rounded-lg border border-border/60 hover:border-amber-500 bg-muted/20 hover:bg-muted transition-all flex items-center justify-between group"
                >
                  <span className="text-xs font-bold text-foreground group-hover:text-amber-400">
                    {tr(`palettes.${pal.id}`, pal.name)}
                  </span>
                  <div className="flex items-center gap-1">
                    {pal.swatches.map((color, idx) => (
                      <span
                        key={idx}
                        className="w-3 h-3 rounded-full border border-black/20 shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Killer Feature 2: One-Click Canvas Preset Resizer */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold shrink-0"
              title={tr('toolbar.presets', '画幅规格')}
            >
              <Scaling className="w-3.5 h-3.5 mr-1" />
              {tr('toolbar.presets', '画幅规格')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2 bg-card border border-border shadow-2xl z-50">
            <div className="text-xs font-bold text-foreground mb-2 px-1 flex items-center justify-between">
              <span>{tr('toolbar.presetsHeader', '多终端海报尺寸规格')}</span>
            </div>
            <div className="space-y-1 max-h-[260px] overflow-y-auto pr-0.5">
              {CANVAS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyCanvasPreset(preset)}
                  className="w-full p-2 rounded-lg border border-border/60 hover:border-cyan-500 bg-muted/20 hover:bg-muted transition-all flex flex-col text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground group-hover:text-cyan-400">
                      {tr(`presets.${preset.id}`, preset.name)}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-card border border-border text-muted-foreground">
                      {preset.ratio}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {tr(`presets.${preset.id}Desc`, preset.description)} ({preset.width}x{preset.height})
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShortcutsModal(true)}
          className="h-7 text-xs px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold shrink-0"
          title={tr('toolbar.shortcuts', '快捷键')}
        >
          <Command className="w-3.5 h-3.5 mr-1 text-blue-400" /> {tr('toolbar.shortcuts', '快捷键')}
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={undo} disabled={!canUndo}>
          <Undo2 className="w-3.5 h-3.5 mr-1" /> {tr('toolbar.undo', '撤销')}
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={redo} disabled={!canRedo}>
          <Redo2 className="w-3.5 h-3.5 mr-1" /> {tr('toolbar.redo', '重做')}
        </Button>





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

        {/* Primary CTA: Export Image */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowExportModal(true)}
          className="h-7 text-xs px-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md shrink-0"
        >
          <ImageIcon className="w-3.5 h-3.5 mr-1" /> {tr('toolbar.exportImage', '导出图片')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBatchExportModal(true)}
          className="h-7 text-xs px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold shrink-0"
          title={tr('toolbar.batchExport', '批量套打')}
        >
          <Scaling className="w-3.5 h-3.5 mr-1 text-indigo-400" /> {tr('toolbar.batchExport', '批量套打')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={openLicenseModal}
          className={`h-7 text-xs px-2.5 font-semibold shrink-0 border ${
            !isLicensed
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
              : isTrial
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
          }`}
          title={
            !isLicensed
              ? tr('license.badgeUnlicensed', '未激活/已锁定')
              : isTrial
              ? tr('license.badgeTrial', '试用版授权 (带水印)')
              : tr('license.badgePro', 'PRO 商业授权')
          }
        >
          <ShieldCheck className={`w-3.5 h-3.5 mr-1 ${
            !isLicensed ? 'text-rose-400' : isTrial ? 'text-amber-400' : 'text-emerald-400'
          }`} />
          {!isLicensed ? tr('license.badgeUnlicensed', '激活授权') : isTrial ? tr('license.badgeTrial', '试用版') : 'PRO'}
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
              onClick={() => setShowSettingsDialog(true)}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-foreground rounded hover:bg-muted transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5 text-slate-400" />
              {tr('settings.title', '设置')}
            </button>

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
      <BatchExportModal open={showBatchExportModal} onClose={() => setShowBatchExportModal(false)} />
      <ShortcutsDialog open={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
      <SettingsDialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} />
    </div>
  )
}
