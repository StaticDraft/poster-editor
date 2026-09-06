import { type DragEvent as ReactDragEvent, type RefObject } from 'react'
import type { App } from 'leafer-ui'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 300 })
    }
    img.onerror = () => {
      resolve({ width: 300, height: 300 })
    }
    img.src = src
  })
}

export function useCanvasDragDrop(containerRef: RefObject<HTMLDivElement | null>, appRef: RefObject<App | null>) {
  const feedback = useFeedback()

  const getCanvasCoordinates = (e: ReactDragEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    const app = appRef.current
    if (!rect || !app) return { x: 100, y: 100 }

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    try {
      const tree = app.tree as any
      if (tree && typeof tree.getPagePoint === 'function') {
        const point = tree.getPagePoint({ x: screenX, y: screenY })
        return { x: point.x, y: point.y }
      } else if (tree) {
        const zoom = tree.scaleX || tree.scale?.x || 1
        const tx = tree.x || 0
        const ty = tree.y || 0
        return {
          x: (screenX - tx) / zoom,
          y: (screenY - ty) / zoom,
        }
      }
    } catch {}

    return { x: screenX, y: screenY }
  }

  const handleDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = async (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const { x: canvasX, y: canvasY } = getCanvasCoordinates(e)

    // 1. 处理直接从 Windows 文件管理器/桌面拖入的本地图片文件
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
      if (files.length === 0) return

      for (const file of files) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string
          if (!dataUrl) return

          const { width: natW, height: natH } = await loadImageDimensions(dataUrl)

          // 限制初次放入画布的最大尺寸（最大宽或高不超过 600px）
          let targetW = natW
          let targetH = natH
          const maxDim = 600
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW >= targetH) {
              targetH = Math.round((targetH / targetW) * maxDim)
              targetW = maxDim
            } else {
              targetW = Math.round((targetW / targetH) * maxDim)
              targetH = maxDim
            }
          }

          useEditorStore.getState().addNode({
            id: `image-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'Image',
            url: dataUrl,
            x: Math.round(canvasX - targetW / 2),
            y: Math.round(canvasY - targetH / 2),
            width: targetW,
            height: targetH,
          })

          feedback.notify({
            title: '图片导入成功',
            description: `已添加本地图片「${file.name}」至画布`,
            tone: 'success',
          })
        }
        reader.readAsDataURL(file)
      }
      return
    }

    // 2. 处理从左侧素材/组件面板拖入的 JSON 数据
    try {
      const rawJson = e.dataTransfer.getData('application/json')
      if (!rawJson) return

      const data = JSON.parse(rawJson)
      const w = data.width || data.defaultProps?.width || 100
      const h = data.height || data.defaultProps?.height || 100

      // 如果按住 Shift 键且拖入图片，则替换已有选中的图片节点
      if (e.shiftKey && (data.type === 'Image' || data.url) && data.url) {
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
            description: '已成功将新图片替换至已有图层',
            tone: 'success',
          })
          return
        }
      }

      useEditorStore.getState().addNode({
        ...(data.defaultProps || {}),
        ...data,
        id: `${(data.type || 'rect').toLowerCase()}-${Date.now()}`,
        x: Math.round(canvasX - w / 2),
        y: Math.round(canvasY - h / 2),
      })
    } catch (err) {
      console.error('Failed to handle canvas drop:', err)
    }
  }

  return {
    handleDragOver,
    handleDrop,
  }
}
