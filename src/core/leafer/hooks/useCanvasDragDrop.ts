import { type DragEvent as ReactDragEvent, type RefObject } from 'react'
import type { App } from 'leafer-ui'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

export function useCanvasDragDrop(containerRef: RefObject<HTMLDivElement | null>, appRef: RefObject<App | null>) {
  const feedback = useFeedback()

  const handleDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      const rect = containerRef.current?.getBoundingClientRect()
      const app = appRef.current
      if (rect && app) {
        const w = data.width || data.defaultProps?.width || 100
        const h = data.height || data.defaultProps?.height || 100

        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top

        let canvasX = screenX
        let canvasY = screenY

        try {
          const tree = app.tree as any
          if (tree && typeof tree.getPagePoint === 'function') {
            const point = tree.getPagePoint({ x: screenX, y: screenY })
            canvasX = point.x
            canvasY = point.y
          } else if (tree) {
            const zoom = tree.scaleX || tree.scale?.x || 1
            const tx = tree.x || 0
            const ty = tree.y || 0
            canvasX = (screenX - tx) / zoom
            canvasY = (screenY - ty) / zoom
          }
        } catch {}

        if ((data.type === 'Image' || data.url) && data.url) {
          const state = useEditorStore.getState()
          const targetImage = state.elements
            .slice()
            .reverse()
            .find((el) => {
              if (el.type !== 'Image') return false
              const ex = el.x
              const ey = el.y
              const ew = el.width || 100
              const eh = el.height || 100
              return canvasX >= ex && canvasX <= ex + ew && canvasY >= ey && canvasY <= ey + eh
            })

          if (targetImage) {
            state.updateNode(targetImage.id, { url: data.url })
            feedback.notify({
              title: '图片替换成功',
              description: '已成功将新图片替换至已有图片图层',
              tone: 'success',
            })
            return
          }
        }

        useEditorStore.getState().addNode({
          ...(data.defaultProps || {}),
          ...data,
          id: `${(data.type || 'rect').toLowerCase()}-${Date.now()}`,
          x: Math.round((canvasX - w / 2) / 16) * 16,
          y: Math.round((canvasY - h / 2) / 16) * 16,
        })
      }
    } catch (e) {}
  }

  return {
    handleDragOver,
    handleDrop,
  }
}
