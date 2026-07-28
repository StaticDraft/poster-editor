import { MainLayout } from './layout/MainLayout'
import { LeaferCanvas } from './core/leafer/LeaferCanvas'
import { ConfigPanel } from './components/right-panel/ConfigPanel'
import { CanvasConfigPanel } from './components/right-panel/CanvasConfigPanel'
import { Sidebar } from './components/left-panel'
import { TopToolbar } from './components/top-toolbar/TopToolbar'
import { useEditorStore } from './store/useEditorStore'
import { buildEditorSaveFingerprint, markDirty, markSaveError, markSaved, markSaving, useSaveStatusStore } from './lib/saveStatus'
import { useEffect, useMemo, useRef } from 'react'
import { PreviewModal } from './components/feedback/PreviewModal'

function RightPanel() {
  const activeIds = useEditorStore(s => s.activeIds)
  
  return (
    <div className="flex flex-col w-full bg-editor h-full overflow-x-hidden min-w-0">
      {activeIds.length > 0 ? <ConfigPanel /> : <CanvasConfigPanel />}
    </div>
  )
}

function App() {
  const isPreview = useEditorStore(s => s.isPreview)
  const elements = useEditorStore(s => s.elements)
  const config = useEditorStore(s => s.canvasConfig)
  const name = useEditorStore(s => s.projectName)
  const cat = useEditorStore(s => s.projectCategory)
  const saveScene = useEditorStore(s => s.saveScene)
  const currentSceneId = useEditorStore(s => s.currentSceneId)
  const lastSavedFingerprint = useSaveStatusStore(s => s.lastFingerprint)
  const didInitRef = useRef(false)

  const saveFingerprint = useMemo(() => buildEditorSaveFingerprint({
    currentSceneId,
    projectName: name,
    projectCategory: cat,
    canvasConfig: config,
    elements,
  }), [cat, config, currentSceneId, elements, name])

  useEffect(() => {
    if (isPreview) return
    if (!didInitRef.current) {
      didInitRef.current = true
      markSaved(saveFingerprint)
      return
    }
    if (saveFingerprint !== lastSavedFingerprint) markDirty()
  }, [isPreview, lastSavedFingerprint, saveFingerprint])

  // Auto-save logic: debounced 1.5s after any canvas change
  useEffect(() => {
    if (!currentSceneId || isPreview || saveFingerprint === lastSavedFingerprint) return
    
    const timer = setTimeout(() => {
      try {
        markSaving()
        saveScene()
        const state = useEditorStore.getState()
        markSaved(buildEditorSaveFingerprint({
          currentSceneId: state.currentSceneId,
          projectName: state.projectName,
          projectCategory: state.projectCategory,
          canvasConfig: state.canvasConfig,
          elements: state.elements,
        }))
      } catch {
        markSaveError('Auto-save failed')
      }
    }, 1500) // 1.5s debounce

    return () => clearTimeout(timer)
  }, [currentSceneId, isPreview, lastSavedFingerprint, saveFingerprint, saveScene])

  return (
    <>
      <MainLayout
        topToolbar={<TopToolbar />}
        leftPanel={<Sidebar />}
        centerCanvas={<LeaferCanvas />}
        rightPanel={<RightPanel />}
      />
      <PreviewModal />
    </>
  )
}

export default App
