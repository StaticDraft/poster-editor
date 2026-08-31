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
import { useAppSettingsStore } from './store/useAppSettingsStore'

import { LicenseModal } from './components/feedback/LicenseModal'
import { useLicenseStore } from './store/useLicenseStore'

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
  const saveTemplate = useEditorStore(s => s.saveTemplate)
  const currentSceneId = useEditorStore(s => s.currentSceneId)
  const editingTemplateId = useEditorStore(s => s.editingTemplateId)
  const autoSaveEnabled = useAppSettingsStore(s => s.autoSave)
  const lastSavedFingerprint = useSaveStatusStore(s => s.lastFingerprint)
  const initLicense = useLicenseStore(s => s.initLicense)
  const isLicensed = useLicenseStore(s => s.isLicensed)
  const isLicenseLoading = useLicenseStore(s => s.isLoading)
  const didInitRef = useRef(false)

  useEffect(() => {
    void initLicense()
  }, [initLicense])

  const saveFingerprint = useMemo(() => buildEditorSaveFingerprint({
    currentSceneId,
    editingTemplateId,
    projectName: name,
    projectCategory: cat,
    canvasConfig: config,
    elements,
  }), [cat, config, currentSceneId, editingTemplateId, elements, name])

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
    if (!autoSaveEnabled || (!currentSceneId && !editingTemplateId) || isPreview || saveFingerprint === lastSavedFingerprint) return
    
    const timer = setTimeout(() => {
      try {
        markSaving()
        if (editingTemplateId) saveTemplate()
        else saveScene()
        const state = useEditorStore.getState()
        markSaved(buildEditorSaveFingerprint({
          currentSceneId: state.currentSceneId,
          editingTemplateId: state.editingTemplateId,
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
  }, [autoSaveEnabled, currentSceneId, editingTemplateId, isPreview, lastSavedFingerprint, saveFingerprint, saveScene, saveTemplate])

  // 未激活时，显示加载中占位页面（阻止编辑器渲染）
  if (isLicenseLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0e17]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">正在验证授权信息...</p>
        </div>
      </div>
    )
  }

  // 未激活时，只渲染 LicenseModal 强锁弹窗，不渲染编辑器主界面
  if (!isLicensed) {
    return <LicenseModal />
  }

  return (
    <>
      <MainLayout
        topToolbar={<TopToolbar />}
        leftPanel={<Sidebar />}
        centerCanvas={<LeaferCanvas />}
        rightPanel={<RightPanel />}
      />
      <PreviewModal />
      <LicenseModal />
    </>
  )
}

export default App

