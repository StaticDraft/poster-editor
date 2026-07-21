import { useEditorStore, type EditorNode, type CanvasConfig } from '@/store/useEditorStore'

export interface PosterTemplatePackage {
  version: string
  generator: string
  createdAt: string
  metadata: {
    name: string
    category: string
    description?: string
  }
  canvasConfig: CanvasConfig
  elements: EditorNode[]
}

const TEMPLATE_PACK_VERSION = '1.0.0'

/**
 * Export current scene as a standalone .poster template file
 */
export function exportTemplatePackage(): void {
  const state = useEditorStore.getState()
  const pkg: PosterTemplatePackage = {
    version: TEMPLATE_PACK_VERSION,
    generator: 'Poster Design Editor',
    createdAt: new Date().toISOString(),
    metadata: {
      name: state.projectName || 'New Poster Template',
      category: state.projectCategory || 'Posters',
    },
    canvasConfig: state.canvasConfig,
    elements: state.elements,
  }

  const jsonStr = JSON.stringify(pkg, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  const safeName = (state.projectName || 'Poster_Template').replace(/[\\/:*?"<>|]/g, '_')
  a.download = `${safeName}.poster`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import a .poster template file and load into editor
 */
export function importTemplatePackage(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text) {
          resolve(false)
          return
        }

        const pkg = JSON.parse(text) as Partial<PosterTemplatePackage>

        if (!pkg.elements || !Array.isArray(pkg.elements) || !pkg.canvasConfig) {
          throw new Error('Invalid template package format')
        }

        const store = useEditorStore.getState()

        // Update canvas config
        store.setCanvasConfig(pkg.canvasConfig)

        // Update elements
        store.setElements(pkg.elements)

        // Update metadata
        if (pkg.metadata?.name) {
          store.setProjectName(pkg.metadata.name)
        }
        if (pkg.metadata?.category) {
          store.setProjectCategory(pkg.metadata.category)
        }

        resolve(true)
      } catch (err) {
        console.error('Failed to import template package:', err)
        reject(err)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
