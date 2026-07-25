import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronDown,
  ClipboardPaste,
  Copy,
  File,
  FileJson,
  FolderOpen,
  Hexagon,
  Save,
  Trash2,
  Undo2,
  Redo2,
  UserCircle,
  Command,
  LayoutTemplate,
} from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { SaveStatusBadge } from '@/components/feedback/SaveStatusBadge'
import { ShortcutsDialog } from '@/components/feedback/ShortcutsDialog'
import { TemplateModal } from '@/components/feedback/TemplateModal'

interface MenuDef {
  label: string
  items: { label: string; icon?: ReactNode; action: () => void | Promise<void>; shortcut?: string }[]
}

export function MainNavbar() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const projectName = useEditorStore((state) => state.projectName)
  const projectCategory = useEditorStore((state) => state.projectCategory)
  const setProjectName = useEditorStore((state) => state.setProjectName)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const copy = useEditorStore((state) => state.copy)
  const paste = useEditorStore((state) => state.paste)
  const clearNodes = useEditorStore((state) => state.clearNodes)

  const handleCopySelection = () => {
    const state = useEditorStore.getState()
    const selectedNodes = state.elements.filter((item) => state.activeIds.includes(item.id))
    if (selectedNodes.length === 0) {
      feedback.notify({
        title: tr('navbar.copyEmpty', '暂无内容可复制'),
        description: tr('navbar.copyEmptyDesc', '请先在画布中选中一个或多个图元。'),
        tone: 'warning',
      })
      setActiveMenu(null)
      return
    }
    copy()
    setActiveMenu(null)
  }

  const handlePasteSelection = () => {
    const state = useEditorStore.getState()
    const clipboardCount = state.clipboard.length
    if (clipboardCount === 0) {
      feedback.notify({
        title: tr('navbar.pasteEmpty', '剪贴板为空'),
        description: tr('navbar.pasteEmptyDesc', '请确保选中图层并在剪切板中有内容。'),
        tone: 'warning',
      })
      setActiveMenu(null)
      return
    }
    paste()
    setActiveMenu(null)
  }

  const handleResetZoom = () => {
    useEditorStore.getState().zoomReset()
    setActiveMenu(null)
  }

  const handleFitWindow = () => {
    useEditorStore.getState().zoomFit()
    setActiveMenu(null)
  }

  const handleOpenDocs = () => {
    window.open('https://antigravity.google', '_blank', 'noopener,noreferrer')
    setActiveMenu(null)
  }

  const handleExportGraphJSON = () => {
    const state = useEditorStore.getState()
    const data = JSON.stringify({ elements: state.elements }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${projectName}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    feedback.notify({
      title: tr('navbar.exportGraphSuccess', '海报JSON数据已导出'),
      description: `${projectName}.json`,
      tone: 'success',
    })
    setActiveMenu(null)
  }

  const handleNewProject = async () => {
    const confirmed = await feedback.confirm({
      title: tr('navbar.confirmNew', '确认创建新海报？'),
      description: tr('navbar.confirmNewDesc', '当前未保存的画布修改会被清空。'),
      confirmLabel: tr('common.confirm', '确认'),
      cancelLabel: tr('common.cancel', '取消'),
      tone: 'warning',
    })
    if (confirmed) {
      clearNodes()
      setProjectName(tr('navbar.newProject', '新设定海报'))
    }
    setActiveMenu(null)
  }

  const handleSaveLocal = () => {
    const state = useEditorStore.getState()
    const data = JSON.stringify({
      projectName,
      projectCategory,
      canvasConfig: state.canvasConfig,
      elements: state.elements,
    })
    localStorage.setItem('poster_project', data)
    feedback.notify({
      title: tr('navbar.savedLocal', '已保存至本地工程'),
      tone: 'success',
    })
    setActiveMenu(null)
  }

  const handleLoadLocal = () => {
    const raw = localStorage.getItem('poster_project')
    if (!raw) {
      feedback.notify({
        title: tr('navbar.noLocalSave', '未检索到本地保存的工程'),
        tone: 'warning',
      })
      setActiveMenu(null)
      return
    }

    const data = JSON.parse(raw)
    useEditorStore.setState({
      elements: data.elements || [],
      canvasConfig: data.canvasConfig || useEditorStore.getState().canvasConfig,
      projectName: data.projectName || data.name || projectName,
      projectCategory: data.projectCategory || projectCategory,
      currentSceneId: null,
      activeIds: [],
    })

    feedback.notify({
      title: tr('navbar.loadLocalSuccess', '本地海报工程已成功载入'),
      tone: 'success',
    })
    setActiveMenu(null)
  }

  const menus: MenuDef[] = [
    {
      label: tr('navbar.file', '文件'),
      items: [
        { label: '海报模板库', icon: <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />, action: () => { setShowTemplateModal(true); setActiveMenu(null) } },
        { label: tr('navbar.menu.newProject', '新建海报'), icon: <File className="w-3.5 h-3.5" />, action: handleNewProject },
        { label: tr('navbar.menu.openLocal', '打开本地'), icon: <FolderOpen className="w-3.5 h-3.5" />, action: handleLoadLocal },
        { label: tr('navbar.menu.saveLocal', '存为模板'), icon: <Save className="w-3.5 h-3.5" />, action: handleSaveLocal, shortcut: 'Ctrl+S' },
        { label: tr('navbar.menu.exportGraph', '导出 JSON'), icon: <FileJson className="w-3.5 h-3.5" />, action: handleExportGraphJSON },
        {
          label: tr('navbar.menu.clearCanvas', '清空设计'),
          icon: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
          action: async () => {
            const confirmed = await feedback.confirm({
              title: tr('navbar.clearCanvasConfirm', '确认清空画布'),
              confirmLabel: tr('common.clear', '清空'),
              cancelLabel: tr('common.cancel', '取消'),
              tone: 'warning',
            })
            if (!confirmed) return
            clearNodes()
            setActiveMenu(null)
          },
        },
      ],
    },
    {
      label: tr('navbar.edit', '编辑'),
      items: [
        { label: tr('navbar.menu.undo', '撤销'), icon: <Undo2 className="w-3.5 h-3.5" />, action: () => { undo(); setActiveMenu(null) }, shortcut: 'Ctrl+Z' },
        { label: tr('navbar.menu.redo', '重做'), icon: <Redo2 className="w-3.5 h-3.5" />, action: () => { redo(); setActiveMenu(null) }, shortcut: 'Ctrl+Y' },
        { label: tr('navbar.menu.copy', '复制'), icon: <Copy className="w-3.5 h-3.5" />, action: handleCopySelection, shortcut: 'Ctrl+C' },
        { label: tr('navbar.menu.paste', '粘贴'), icon: <ClipboardPaste className="w-3.5 h-3.5" />, action: handlePasteSelection, shortcut: 'Ctrl+V' },
      ],
    },
    {
      label: tr('navbar.tools', '工具'),
      items: [
        { label: tr('navbar.menu.resetZoom', '重置缩放'), action: handleResetZoom },
        { label: tr('navbar.menu.fitWindow', '自适应缩放'), action: handleFitWindow },
      ],
    },
    {
      label: tr('navbar.help', '帮助'),
      items: [
        { label: '快捷键指南', icon: <Command className="w-3.5 h-3.5" />, action: () => { setShowShortcuts(true); setActiveMenu(null) } },
        { label: tr('navbar.menu.viewDocs', '查看文档'), action: handleOpenDocs },
        {
          label: tr('navbar.menu.about', '关于'),
          action: () => {
            feedback.notify({
              title: tr('navbar.menu.about', '关于 Poster Editor'),
              description: tr('navbar.aboutMsg', '基于 Leafer.js 高效渲染引擎构建的极简海报编辑器。'),
              tone: 'info',
            })
            setActiveMenu(null)
          },
        },
      ],
    },
  ]

  return (
    <div
      className="relative z-50 flex h-12 shrink-0 items-center justify-between border-b border-editor-darker bg-editor px-4 text-xs font-medium text-editor-text shadow-md"
      onClick={() => setActiveMenu(null)}
    >
      <div className="flex items-center gap-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center text-sm font-bold tracking-widest text-[#fb7185] shrink-0">
          <Hexagon className="mr-2 h-5 w-5 fill-[#rose-500/20] shrink-0" /> Poster Editor
        </div>
        <div className="flex gap-1">
          {menus.map((menu) => (
            <div key={menu.label} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                className={`flex items-center gap-1 rounded px-3 py-1.5 text-[13px] font-bold transition-colors ${activeMenu === menu.label ? 'bg-blue-600/30 text-editor-text' : 'hover:bg-editor-surface hover:text-editor-text'}`}
              >
                {menu.label} <ChevronDown className="h-3 w-3 opacity-50" />
              </button>
              {activeMenu === menu.label && (
                <div className="absolute left-0 top-full z-[200] mt-1 min-w-[190px] rounded border border-border bg-ruler py-1.5 shadow-2xl">
                  {menu.items.map((item, index) => (
                    <button
                      key={`${menu.label}-${index}`}
                      onClick={item.action}
                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-editor-text transition-colors hover:bg-editor-surface hover:text-editor-text"
                    >
                      <span className="flex items-center gap-2">{item.icon}{item.label}</span>
                      {item.shortcut ? <span className="text-[10px] text-editor-text-dim">{item.shortcut}</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2" onClick={(event) => event.stopPropagation()}>
        {editing ? (
          <input
            autoFocus
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(event) => event.key === 'Enter' && setEditing(false)}
            className="w-40 rounded border border-blue-500 bg-editor-deep px-2 py-0.5 text-center text-[13px] font-bold text-editor-text focus:outline-none"
          />
        ) : (
          <span
            onDoubleClick={() => setEditing(true)}
            className="cursor-text border-b border-transparent text-[13px] font-bold tracking-widest text-editor-text transition-colors hover:border-blue-400 hover:text-blue-500"
            title={tr('navbar.doubleClickRename', '双击重命名')}
          >
            {projectName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-5">
        <SaveStatusBadge />
        <span className="cursor-pointer text-xs font-bold text-[#fb7185]">{tr('navbar.vis2d', '海报设计中心')}</span>
        <UserCircle className="h-6 w-6 cursor-pointer text-editor-text transition-transform hover:scale-110" />
      </div>
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <TemplateModal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} />
    </div>
  )
}
