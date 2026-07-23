import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Copy, FileText, Folder, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEditorStore, type CanvasConfig, type EditorNode } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'
import { cn } from '@/lib/utils'
import { CanvasThumbnail, type CanvasThumbnailSnapshot } from './CanvasThumbnail'

type SceneRecord = {
  canvasConfig?: CanvasConfig
  elements?: EditorNode[]
}

function loadScenePreview(id: string): CanvasThumbnailSnapshot | null {
  const raw = window.localStorage.getItem(`poster_scene_${id}`)
  if (!raw) return null

  try {
    const data = JSON.parse(raw) as SceneRecord
    return {
      canvasConfig: data.canvasConfig || {
        width: 800,
        height: 1200,
        bgColor: '#1e2430',
        showGrid: true,
        scaleMode: 'auto',
        lockPan: false,
        lockZoom: false,
      },
      elements: Array.isArray(data.elements) ? data.elements : [],
    }
  } catch {
    return null
  }
}

export function SceneList() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }
  const scenes = useEditorStore((state) => state.scenes)
  const currentSceneId = useEditorStore((state) => state.currentSceneId)
  const loadScene = useEditorStore((state) => state.loadScene)
  const deleteScene = useEditorStore((state) => state.deleteScene)
  const createScene = useEditorStore((state) => state.createScene)
  const renameScene = useEditorStore((state) => state.renameScene)
  const duplicateScene = useEditorStore((state) => state.duplicateScene)
  const [scenePreviews, setScenePreviews] = useState<Record<string, CanvasThumbnailSnapshot | null>>({})

  useEffect(() => {
    const nextPreviews: Record<string, CanvasThumbnailSnapshot | null> = {}
    scenes.forEach((scene) => {
      nextPreviews[scene.id] = loadScenePreview(scene.id)
    })
    setScenePreviews(nextPreviews)
  }, [scenes])

  const handleSelect = (id: string) => {
    window.history.pushState(null, '', `?scene=${id}`)
    loadScene(id)
    const state = useEditorStore.getState()
    markSaved(buildEditorSaveFingerprint({
      currentSceneId: state.currentSceneId,
      projectName: state.projectName,
      projectCategory: state.projectCategory,
      canvasConfig: state.canvasConfig,
      elements: state.elements,
    }))
  }

  const handleCreate = () => {
    const newName = `${tr('scene.untitledPoster', '未命名海报')}_${scenes.length + 1}`
    createScene(newName)
    const state = useEditorStore.getState()
    const realId = state.currentSceneId
    if (realId) {
      markSaved(buildEditorSaveFingerprint({
        currentSceneId: state.currentSceneId,
        projectName: state.projectName,
        projectCategory: state.projectCategory,
        canvasConfig: state.canvasConfig,
        elements: state.elements,
      }))
      window.history.pushState(null, '', `?scene=${realId}`)
      feedback.notify({
        title: tr('scene.createSuccess', '海报已创建'),
        description: newName,
        tone: 'success',
      })
    }
  }

  const handleRename = async (id: string, currentName: string) => {
    const nextName = await feedback.prompt({
      title: tr('scene.rename', '重命名设计'),
      description: tr('scene.renamePrompt', '请输入海报新名称'),
      defaultValue: currentName,
      placeholder: tr('scene.namePlaceholder', '设计图标题'),
      confirmLabel: tr('common.save', '确定'),
      cancelLabel: tr('common.cancel', '取消'),
      tone: 'info',
      validate: (value) => (value.trim() ? null : tr('scene.nameRequired', '名称不能为空')),
    })
    if (!nextName || nextName === currentName) return
    renameScene(id, nextName)
    feedback.notify({
      title: tr('scene.renameSuccess', '重命名成功'),
      description: nextName,
      tone: 'success',
    })
  }

  const handleDuplicate = async (id: string, currentName: string) => {
    const nextName = await feedback.prompt({
      title: tr('scene.duplicate', '复制海报'),
      description: tr('scene.duplicatePrompt', '请输入新复制的标题'),
      defaultValue: `${currentName} 副本`,
      placeholder: tr('scene.namePlaceholder', '海报名'),
      confirmLabel: tr('common.confirm', '确认'),
      cancelLabel: tr('common.cancel', '取消'),
      tone: 'info',
      validate: (value) => (value.trim() ? null : tr('scene.nameRequired', '名称不能为空')),
    })
    if (!nextName) return
    const nextId = duplicateScene(id, nextName)
    if (!nextId) {
      feedback.notify({
        title: tr('scene.duplicateFailed', '复制失败'),
        tone: 'error',
      })
      return
    }
    window.history.pushState(null, '', `?scene=${nextId}`)
    loadScene(nextId)
    const state = useEditorStore.getState()
    markSaved(buildEditorSaveFingerprint({
      currentSceneId: state.currentSceneId,
      projectName: state.projectName,
      projectCategory: state.projectCategory,
      canvasConfig: state.canvasConfig,
      elements: state.elements,
    }))
    feedback.notify({
      title: tr('scene.duplicateSuccess', '设计图已复制'),
      description: nextName,
      tone: 'success',
    })
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await feedback.confirm({
      title: tr('scene.confirmDelete', '确定要删除此场景图吗？'),
      description: name,
      confirmLabel: tr('common.delete', '删除'),
      cancelLabel: tr('common.cancel', '取消'),
      tone: 'warning',
    })
    if (!confirmed) return
    deleteScene(id)
    feedback.notify({
      title: tr('scene.deleteSuccess', '设计图已清除'),
      description: name,
      tone: 'success',
    })
  }

  return (
    <div className="flex h-full flex-col bg-editor">
      <div className="flex items-center justify-between border-b border-editor-darker p-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <Folder className="h-3.5 w-3.5 text-blue-400" />
          {tr('scene.title', '我的设计海报库')}
        </div>
        <button
          onClick={handleCreate}
          className="rounded p-1 text-blue-400 transition-colors hover:bg-blue-500/20"
          title={tr('scene.createNow', '创建新场景')}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {scenes.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center space-y-2 text-[10px] text-editor-text-dim">
            <FileText className="h-8 w-8 opacity-20" />
            <p>{tr('scene.noRecords', '暂无海报设计记录')}</p>
            <button
              onClick={handleCreate}
              className="mt-2 rounded-sm bg-blue-600 px-3 py-1 text-white transition-colors hover:bg-blue-500"
            >
              {tr('scene.createNow', '画第一份设计')}
            </button>
          </div>
        ) : (
          scenes.map((scene) => (
            <div
              key={scene.id}
              onClick={() => handleSelect(scene.id)}
              className={cn(
                'group flex cursor-pointer flex-col gap-2 rounded-md border border-transparent p-2.5 transition-all',
                currentSceneId === scene.id
                  ? 'border-blue-500/30 bg-blue-500/10 text-white'
                  : 'text-editor-text-label hover:bg-editor-deep hover:text-white',
              )}
            >
              <CanvasThumbnail
                snapshot={scenePreviews[scene.id] || null}
                emptyLabel={tr('scene.previewEmpty', '空白画布')}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className={cn('h-3.5 w-3.5 shrink-0', currentSceneId === scene.id ? 'text-blue-400' : 'text-editor-text-dim')} />
                  <span className="truncate text-xs font-medium">{scene.name}</span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleRename(scene.id, scene.name)
                    }}
                    className="p-1 opacity-0 transition-opacity hover:text-blue-300 group-hover:opacity-100"
                    title={tr('scene.rename', '重命名')}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleDuplicate(scene.id, scene.name)
                    }}
                    className="p-1 opacity-0 transition-opacity hover:text-emerald-300 group-hover:opacity-100"
                    title={tr('scene.duplicate', '复制')}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleDelete(scene.id, scene.name)
                    }}
                    className="p-1 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    title={tr('common.delete', '删除')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between text-[9px] text-editor-text-dim">
                <div className="flex items-center gap-1">
                  <span className="rounded bg-editor-darker px-1 text-editor-text-label">{scene.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(scene.lastModified).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-editor-darker bg-editor-deep/50 p-3 text-[9px] text-editor-text-dim">
        {tr('scene.autoSaveHint', '* 画布进度自动本地存档，不用担心网络中断。')}
      </div>
    </div>
  )
}
