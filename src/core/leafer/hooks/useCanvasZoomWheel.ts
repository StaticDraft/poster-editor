import { useEffect, type RefObject } from 'react'
import type { App } from 'leafer-ui'

const WHEEL_ZOOM_SPEED = 0.0015
const WHEEL_ZOOM_MIN = 0.05
const WHEEL_ZOOM_MAX = 20
const WHEEL_PAN_SPEED = 1.5

export function useCanvasZoomWheel(
  containerRef: RefObject<HTMLDivElement | null>,
  appRef: RefObject<App | null>
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onCanvasWheel = (e: WheelEvent) => {
      const app = appRef.current
      if (!app) return
      e.preventDefault()

      const tree = (app as any).tree
      const zoomLayer = tree?.zoomLayer
      if (!zoomLayer) return

      if (!e.shiftKey) {
        // 缩放：默认滚轮行为，以鼠标位置为中心
        const delta = e.deltaY
        const currentScale = zoomLayer.scaleX || 1
        const scaleFactor = Math.max(
          WHEEL_ZOOM_MIN / currentScale,
          Math.min(1 - delta * WHEEL_ZOOM_SPEED, WHEEL_ZOOM_MAX / currentScale)
        )
        const rect = container.getBoundingClientRect()
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        const pointX = (screenX - (zoomLayer.x || 0)) / currentScale
        const pointY = (screenY - (zoomLayer.y || 0)) / currentScale
        const newScale = Math.max(WHEEL_ZOOM_MIN, Math.min(currentScale * scaleFactor, WHEEL_ZOOM_MAX))
        zoomLayer.set({
          scaleX: newScale,
          scaleY: newScale,
          x: screenX - pointX * newScale,
          y: screenY - pointY * newScale,
        })
      } else {
        // 平移：Shift + 滚轮（横向滚动）
        zoomLayer.set({
          x: (zoomLayer.x || 0) - e.deltaY * WHEEL_PAN_SPEED,
        })
      }
      app.forceRender?.(undefined, true)
    }

    container.addEventListener('wheel', onCanvasWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', onCanvasWheel)
    }
  }, [containerRef, appRef])
}
