import { Line } from 'leafer-ui'
import { useEditorStore } from '@/store/useEditorStore'

interface SnapPoint {
  val: number
  ref: string
}

export function handleNodeDragSnap(
  target: any,
  app: any,
  nodeMap: Map<string, any>,
  guideGroup: any,
  threshold = 6
) {
  if (!target || !target.id || target.id === '__scene_board__' || target.id === '__guide_group__') {
    return
  }

  guideGroup.removeAll()

  const draggingId = target.id
  const otherNodes: any[] = []
  nodeMap.forEach((node, id) => {
    if (id !== draggingId && node.parent && id !== '__scene_board__' && id !== '__guide_group__') {
      otherNodes.push(node)
    }
  })

  // Also snap to canvas center lines
  const { width: bWidth, height: bHeight } = useEditorStore.getState().canvasConfig
  otherNodes.push({
    x: bWidth / 2,
    y: bHeight / 2,
    width: 0,
    height: 0,
    id: '__board_center__',
  } as any)

  if (otherNodes.length === 0) return

  let targetX = target.x
  let targetY = target.y

  const dragX_L = target.x
  const dragX_C = target.x + (target.width || 0) / 2
  const dragX_R = target.x + (target.width || 0)

  const dragY_T = target.y
  const dragY_M = target.y + (target.height || 0) / 2
  const dragY_B = target.y + (target.height || 0)

  let minDiffX = Infinity
  let alignedOtherX: any = null
  let matchDragX = 0
  let matchOtherX = 0

  for (const other of otherNodes) {
    const otherX_L = other.x
    const otherX_C = other.x + (other.width || 0) / 2
    const otherX_R = other.x + (other.width || 0)

    const dragPoints: SnapPoint[] = [
      { val: dragX_L, ref: 'L' },
      { val: dragX_C, ref: 'C' },
      { val: dragX_R, ref: 'R' },
    ]
    const otherPoints: SnapPoint[] = [
      { val: otherX_L, ref: 'L' },
      { val: otherX_C, ref: 'C' },
      { val: otherX_R, ref: 'R' },
    ]

    for (const dp of dragPoints) {
      for (const op of otherPoints) {
        const diff = Math.abs(dp.val - op.val)
        if (diff < threshold && diff < minDiffX) {
          minDiffX = diff
          alignedOtherX = other
          matchDragX = dp.val
          matchOtherX = op.val
        }
      }
    }
  }

  if (alignedOtherX) {
    if (matchDragX === dragX_L) {
      targetX = matchOtherX
    } else if (matchDragX === dragX_C) {
      targetX = matchOtherX - (target.width || 0) / 2
    } else {
      targetX = matchOtherX - (target.width || 0)
    }
  }

  let minDiffY = Infinity
  let alignedOtherY: any = null
  let matchDragY = 0
  let matchOtherY = 0

  for (const other of otherNodes) {
    const otherY_T = other.y
    const otherY_M = other.y + (other.height || 0) / 2
    const otherY_B = other.y + (other.height || 0)

    const dragPoints: SnapPoint[] = [
      { val: dragY_T, ref: 'T' },
      { val: dragY_M, ref: 'M' },
      { val: dragY_B, ref: 'B' },
    ]
    const otherPoints: SnapPoint[] = [
      { val: otherY_T, ref: 'T' },
      { val: otherY_M, ref: 'M' },
      { val: otherY_B, ref: 'B' },
    ]

    for (const dp of dragPoints) {
      for (const op of otherPoints) {
        const diff = Math.abs(dp.val - op.val)
        if (diff < threshold && diff < minDiffY) {
          minDiffY = diff
          alignedOtherY = other
          matchDragY = dp.val
          matchOtherY = op.val
        }
      }
    }
  }

  if (alignedOtherY) {
    if (matchDragY === dragY_T) {
      targetY = matchOtherY
    } else if (matchDragY === dragY_M) {
      targetY = matchOtherY - (target.height || 0) / 2
    } else {
      targetY = matchOtherY - (target.height || 0)
    }
  }

  const editorList = ((app as any).editor?.list || []) as any[]
  const diffX = targetX - target.x
  const diffY = targetY - target.y

  if (editorList.length > 1 && (diffX !== 0 || diffY !== 0)) {
    editorList.forEach((n: any) => {
      if (n && typeof n.set === 'function') {
        n.set({ x: (n.x || 0) + diffX, y: (n.y || 0) + diffY })
      }
    })
  } else {
    target.set({ x: targetX, y: targetY })
  }

  if (alignedOtherX) {
    const minY = Math.min(targetY, alignedOtherX.y)
    const maxY = Math.max(targetY + (target.height || 0), alignedOtherX.y + (alignedOtherX.height || 0))
    guideGroup.add(new Line({
      points: [matchOtherX, minY - 100, matchOtherX, maxY + 100],
      stroke: '#ef4444',
      strokeWidth: 1,
      dashPattern: [4, 4],
      hittable: false,
    }))
  }

  if (alignedOtherY) {
    const minX = Math.min(targetX, alignedOtherX ? alignedOtherX.x : alignedOtherY.x)
    const maxX = Math.max(targetX + (target.width || 0), alignedOtherX ? (alignedOtherX.x + (alignedOtherX.width || 0)) : (alignedOtherY.x + (alignedOtherY.width || 0)))
    guideGroup.add(new Line({
      points: [minX - 100, matchOtherY, maxX + 100, matchOtherY],
      stroke: '#ef4444',
      strokeWidth: 1,
      dashPattern: [4, 4],
      hittable: false,
    }))
  }

  if (app.editor) {
    app.editor.updateEditBox()
  }
}
