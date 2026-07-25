import { Group, Line } from 'leafer-ui'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface GuideLine {
  type: 'h' | 'v'
  position: number
  start: number
  end: number
}

export function computeSmartGuides(
  targetBox: BoundingBox,
  otherBoxes: BoundingBox[],
  boardWidth: number,
  boardHeight: number,
  threshold = 5
): { snappedX: number; snappedY: number; guides: GuideLine[] } {
  let snappedX = targetBox.x
  let snappedY = targetBox.y

  const targetCX = targetBox.x + targetBox.width / 2
  const targetCY = targetBox.y + targetBox.height / 2
  const targetRight = targetBox.x + targetBox.width
  const targetBottom = targetBox.y + targetBox.height

  // Include canvas board center and edges as alignment targets
  const allTargets: BoundingBox[] = [
    { x: 0, y: 0, width: boardWidth, height: boardHeight },
    ...otherBoxes,
  ]

  let minDiffX = threshold + 1
  let minDiffY = threshold + 1
  const guides: GuideLine[] = []

  // Check Vertical Alignments (X-axis)
  const targetXPoints = [
    { type: 'left', val: targetBox.x, offset: 0 },
    { type: 'center', val: targetCX, offset: targetBox.width / 2 },
    { type: 'right', val: targetRight, offset: targetBox.width },
  ]

  for (const tBox of allTargets) {
    const tCX = tBox.x + tBox.width / 2
    const tRight = tBox.x + tBox.width
    const targetPointsX = [tBox.x, tCX, tRight]

    for (const tpX of targetPointsX) {
      for (const pX of targetXPoints) {
        const diff = Math.abs(pX.val - tpX)
        if (diff <= threshold && diff < minDiffX) {
          minDiffX = diff
          snappedX = tpX - pX.offset
          const minY = Math.min(targetBox.y, tBox.y) - 20
          const maxY = Math.max(targetBottom, tBox.y + tBox.height) + 20
          guides.push({ type: 'v', position: tpX, start: minY, end: maxY })
        }
      }
    }
  }

  // Check Horizontal Alignments (Y-axis)
  const targetYPoints = [
    { type: 'top', val: targetBox.y, offset: 0 },
    { type: 'middle', val: targetCY, offset: targetBox.height / 2 },
    { type: 'bottom', val: targetBottom, offset: targetBox.height },
  ]

  for (const tBox of allTargets) {
    const tCY = tBox.y + tBox.height / 2
    const tBottom = tBox.y + tBox.height
    const targetPointsY = [tBox.y, tCY, tBottom]

    for (const tpY of targetPointsY) {
      for (const pY of targetYPoints) {
        const diff = Math.abs(pY.val - tpY)
        if (diff <= threshold && diff < minDiffY) {
          minDiffY = diff
          snappedY = tpY - pY.offset
          const minX = Math.min(targetBox.x, tBox.x) - 20
          const maxX = Math.max(targetRight, tBox.x + tBox.width) + 20
          guides.push({ type: 'h', position: tpY, start: minX, end: maxX })
        }
      }
    }
  }

  return { snappedX, snappedY, guides }
}

export function renderGuideLines(guideGroup: Group, guides: GuideLine[]) {
  guideGroup.removeAll()
  guides.forEach((g) => {
    if (g.type === 'v') {
      const line = new Line({
        x: g.position,
        y: g.start,
        to: { x: 0, y: g.end - g.start },
        stroke: '#f43f5e',
        strokeWidth: 1,
        dashPattern: [4, 4],
      })
      guideGroup.add(line)
    } else {
      const line = new Line({
        x: g.start,
        y: g.position,
        to: { x: g.end - g.start, y: 0 },
        stroke: '#f43f5e',
        strokeWidth: 1,
        dashPattern: [4, 4],
      })
      guideGroup.add(line)
    }
  })
}
