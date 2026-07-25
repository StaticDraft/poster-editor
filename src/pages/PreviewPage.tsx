import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LeaferViewer } from '@/core/leafer/LeaferViewer'
import { useEditorStore } from '@/store/useEditorStore'

export default function PreviewPage() {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)

  const elements = useEditorStore((state) => state.elements)
  const canvasConfig = useEditorStore((state) => state.canvasConfig)
  const setElements = useEditorStore((state) => state.setElements)
  const setCanvasConfig = useEditorStore((state) => state.setCanvasConfig)
  const setIsPreview = useEditorStore((state) => state.setIsPreview)
  const loadScene = useEditorStore((state) => state.loadScene)

  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sceneId = params.get('scene')

    const raw = localStorage.getItem('poster_preview_snapshot')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        if (data.canvasConfig) setCanvasConfig(data.canvasConfig)
        if (data.elements) setElements(data.elements)
      } catch (error) {
        console.error('Preview: failed to parse snapshot', error)
      }
    } else if (sceneId) {
      loadScene(sceneId)
    }

    setIsPreview(true)
    setReady(true)
    return () => {
      setIsPreview(false)
    }
  }, [])

  if (!ready) {
    return (
      <div className="w-screen h-screen bg-editor flex items-center justify-center">
        <div className="text-blue-400 text-sm animate-pulse">{tr('preview.loading', '正在加载预览场景…')}</div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      <LeaferViewer
        elements={elements}
        canvasConfig={canvasConfig}
      />

      <div className="fixed bottom-4 right-4 z-50 text-[10px] text-editor-text-dim bg-editor-darker/90 rounded px-3 py-1.5 border border-border backdrop-blur-sm">
        {tr('preview.hint', '海报预览发布模式 · 关闭窗口即可返回')}
      </div>
    </div>
  )
}
