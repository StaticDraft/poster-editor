import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import PreviewPage from './pages/PreviewPage.tsx'
import './index.css'
import './locales/i18n'
import { useEditorStore } from './store/useEditorStore'
import { FeedbackHost } from './components/feedback/FeedbackHost.tsx'

// Comprehensive Bootloader
function Main() {
  const isPreview =
    window.location.pathname.endsWith('/preview') ||
    window.location.hash.includes('preview') ||
    window.location.search.includes('preview=1')
  const initScenes = useEditorStore(s => s.initScenes)
  const loadScene = useEditorStore(s => s.loadScene)

  useEffect(() => {
    // 1. Init index (scenes index might be needed for names etc., but we don't routing here)
    initScenes()
    
    // 2. Routing logic
    // SKIP auto-routing and scene loading if we are in PREVIEW mode.
    // The PreviewPage will handle its own data hydration (from snapshot or specific scene).
    if (isPreview) return

    const params = new URLSearchParams(window.location.search)
    const sceneId = params.get('scene')
    
    if (sceneId) {
      loadScene(sceneId)
    } else {
      // Auto-load the first scene if one exists
      const rawIndex = localStorage.getItem('poster_scenes_index')
      if (rawIndex) {
        const index = JSON.parse(rawIndex)
        if (index.length > 0) {
          const firstSceneId = index[0].id
          window.history.replaceState(null, '', `?scene=${firstSceneId}`)
          loadScene(firstSceneId)
        }
      }
    }
  }, [isPreview]) // Added isPreview to dependencies for clarity

  return (
    <>
      {isPreview ? <PreviewPage /> : <App />}
      <FeedbackHost />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
