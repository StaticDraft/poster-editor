import type { CanvasConfig, EditorNode } from '@/store/useEditorStore'

export interface CanvasThumbnailSnapshot {
  canvasConfig: CanvasConfig
  elements: EditorNode[]
}

function normalizeColor(color: any, fallback: string) {
  if (typeof color === 'string' && color.trim()) return color
  if (color && typeof color === 'object') {
    // Gradient: return first stop color
    if (Array.isArray(color.stops) && color.stops.length > 0) {
      const firstStop = color.stops[0]
      if (typeof firstStop === 'string' && firstStop.trim()) return firstStop
    }
    // Image background: return a placeholder
    if (color.type === 'image') return '#94a3b8'
  }
  return fallback
}

function isEllipseLike(node: EditorNode) {
  return ['circle', 'ellipse'].includes(node.type) || node.type === 'Ellipse'
}

function isDiamondLike(node: EditorNode) {
  return ['diamond'].includes(node.type)
}

function isTriangleLike(node: EditorNode) {
  return ['triangle'].includes(node.type)
}

function isMediaLike(node: EditorNode) {
  return ['Image', 'image'].includes(node.type) || !!node.url
}

export function CanvasThumbnail({
  snapshot,
  emptyLabel,
}: {
  snapshot: CanvasThumbnailSnapshot | null
  emptyLabel: string
}) {
  if (!snapshot) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-editor-deep text-[10px] text-editor-text-dim">
        {emptyLabel}
      </div>
    )
  }

  const nodes = snapshot.elements.filter((item) => !item.hidden)
  if (!nodes.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-editor-deep text-[10px] text-editor-text-dim">
        {emptyLabel}
      </div>
    )
  }

  const baseWidth = snapshot.canvasConfig.width || 800
  const baseHeight = snapshot.canvasConfig.height || 1200
  const minX = nodes.length ? Math.min(...nodes.map((item) => item.x || 0)) : 0
  const minY = nodes.length ? Math.min(...nodes.map((item) => item.y || 0)) : 0
  const maxX = nodes.length ? Math.max(...nodes.map((item) => (item.x || 0) + (item.width || 120))) : baseWidth
  const maxY = nodes.length ? Math.max(...nodes.map((item) => (item.y || 0) + (item.height || 80))) : baseHeight
  const contentWidth = Math.max(240, maxX - minX + 64)
  const contentHeight = Math.max(160, maxY - minY + 64)
  const offsetX = minX - 32
  const offsetY = minY - 32

  return (
    <div className="h-24 overflow-hidden rounded-md border border-border bg-editor-deep/80">
      <svg
        viewBox={`0 0 ${contentWidth} ${contentHeight}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x={0}
          y={0}
          width={contentWidth}
          height={contentHeight}
          fill={normalizeColor(snapshot.canvasConfig.bgColor, '#111827')}
        />
        {nodes.map((node) => {
          const x = (node.x || 0) - offsetX
          const y = (node.y || 0) - offsetY
          const width = Math.max(36, node.width || 120)
          const height = Math.max(24, node.height || 72)
          const fill = normalizeColor(node.fill || node.props?.fill, '#334155')
          const stroke = normalizeColor(node.props?.stroke, 'rgba(255,255,255,0.25)')

          if (isEllipseLike(node)) {
            return <ellipse key={node.id} cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} fill={fill} stroke={stroke} strokeWidth={6} />
          }

          if (isDiamondLike(node)) {
            return (
              <polygon
                key={node.id}
                points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={6}
              />
            )
          }

          if (isTriangleLike(node)) {
            return (
              <polygon
                key={node.id}
                points={`${x + width / 2},${y} ${x + width},${y + height} ${x},${y + height}`}
                fill={fill}
                stroke={stroke}
                strokeWidth={6}
              />
            )
          }

          if (isMediaLike(node)) {
            return (
              <g key={node.id}>
                <rect x={x} y={y} width={width} height={height} rx={10} fill="#111827" stroke="#a78bfa" strokeWidth={6} />
                <path d={`M ${x + width * 0.28} ${y + height * 0.2} L ${x + width * 0.78} ${y + height * 0.5} L ${x + width * 0.28} ${y + height * 0.8} Z`} fill="#c4b5fd" />
              </g>
            )
          }

          return (
            <g key={node.id}>
              <rect x={x} y={y} width={width} height={height} rx={10} fill={fill} stroke={stroke} strokeWidth={6} />
              {node.text ? (
                <rect
                  x={x + 12}
                  y={y + Math.min(height - 12, 18)}
                  width={Math.max(16, Math.min(width - 24, width * 0.56))}
                  height={8}
                  rx={4}
                  fill="rgba(255,255,255,0.55)"
                />
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
