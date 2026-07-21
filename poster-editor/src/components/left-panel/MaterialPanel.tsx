import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Type, Upload, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'

// ─────────────────────────────────────────────────
// SVG path definitions for graphic design elements
// ─────────────────────────────────────────────────
const PATHS = {
  triangle:      'M50 5 L95 90 L5 90 Z',
  diamond:       'M50 2 L98 50 L50 98 L2 50 Z',
  pentagon:      'M50 2 L97 35 L79 94 L21 94 L3 35 Z',
  hexagon:       'M25 3 L75 3 L98 46 L75 93 L25 93 L2 46 Z',
  retroStar:     'M50 5 Q50 50 5 50 Q50 50 50 95 Q50 50 95 50 Q50 50 50 5 Z', // 4-point star
  blob1:         'M25 20 Q10 40 25 60 T75 60 T85 30 T50 15 Z',
  blob2:         'M20 30 Q30 5 60 15 T85 45 T75 85 T35 75 Z',
  badge:         'M50 2 L60 38 L98 38 L67 60 L79 96 L50 75 L21 96 L33 60 L2 38 L40 38 Z',
  banner:        'M10 20 L90 20 L90 80 L10 80 L25 50 Z',
  crossLine:     'M10 10 L90 90 M90 10 L10 90',
  frameCorner:   'M10 30 L10 10 L30 10 M70 10 L90 10 L90 30 M90 70 L90 90 L70 90 M30 90 L10 90 L10 70',
}

// ─────────────────────────────────────────────────
// Material categories for a poster designer
// ─────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'text-nodes',
    titleKey: 'material.categories.textNodes',
    fallbackTitle: '高级文本排版',
    items: [
      { type: 'Text', nameKey: 'material.items.superTitle', fallbackName: '特大醒目标题', text: 'SUMMER', fill: '#ef4444', width: 360, height: 100, fontSize: 72, props: { fontweight: '900', textalign: 'center' } },
      { type: 'Text', nameKey: 'material.items.titleText', fallbackName: '正标题文本', text: '设计狂欢夜', fill: '#ffffff', width: 260, height: 60, fontSize: 36, props: { fontweight: '700', textalign: 'center' } },
      { type: 'Text', nameKey: 'material.items.subTitleText', fallbackName: '创意副标题', text: 'CREATIVE DESIGN PARTY', fill: '#94a3b8', width: 220, height: 40, fontSize: 16, props: { fontweight: '500', textalign: 'center', letterspacing: '2px' } },
      { type: 'Text', nameKey: 'material.items.textLabel', fallbackName: '普通正文', text: '双击编辑修改此文本内容。海报设计与版式构图。', fill: '#cbd5e1', width: 240, height: 80, fontSize: 13 },
      { type: 'Text', nameKey: 'material.items.tagLabel', fallbackName: '标签属性文本', text: '限时 8.5 折', fill: '#f59e0b', width: 100, height: 30, fontSize: 12, props: { border: '1px solid #f59e0b', padding: '4px 8px' } },
    ]
  },
  {
    id: 'basic-shapes',
    titleKey: 'material.categories.basicShapes',
    fallbackTitle: '基础排版几何',
    items: [
      { type: 'Rect', nameKey: 'material.items.rect', fallbackName: '排版矩形', fill: '#3b82f6', width: 300, height: 200 },
      { type: 'Rect', nameKey: 'material.items.square', fallbackName: '正方形框', fill: '#e2e8f0', width: 150, height: 150 },
      { type: 'Rect', nameKey: 'material.items.roundRect', fallbackName: '圆角背景块', fill: '#fff', width: 200, height: 100, cornerRadius: 16 },
      { type: 'Ellipse', nameKey: 'material.items.circle', fallbackName: '渐变印章圆', fill: '#ef4444', width: 120, height: 120 },
      { type: 'Path', nameKey: 'material.items.triangle', fallbackName: '三角几何', fill: '#f59e0b', unitPath: PATHS.triangle, width: 100, height: 100 },
      { type: 'Path', nameKey: 'material.items.diamond', fallbackName: '菱形装饰', fill: '#8b5cf6', unitPath: PATHS.diamond, width: 100, height: 100 },
    ]
  },
  {
    id: 'stickers',
    titleKey: 'material.categories.stickers',
    fallbackTitle: '潮酷矢量贴纸',
    items: [
      { type: 'Path', nameKey: 'material.items.retroStar', fallbackName: '极光闪烁星', fill: '#fcd34d', unitPath: PATHS.retroStar, width: 80, height: 80 },
      { type: 'Path', nameKey: 'material.items.blob1', fallbackName: '酸性液体 01', fill: '#10b981', unitPath: PATHS.blob1, width: 180, height: 150 },
      { type: 'Path', nameKey: 'material.items.blob2', fallbackName: '微光流体 02', fill: '#6366f1', unitPath: PATHS.blob2, width: 160, height: 160 },
      { type: 'Path', nameKey: 'material.items.crossLine', fallbackName: '潮流交叉线', fill: '#c084fc', unitPath: PATHS.crossLine, width: 60, height: 60 },
      { type: 'Path', nameKey: 'material.items.frameCorner', fallbackName: '摄影取景框', fill: '#ffffff', unitPath: PATHS.frameCorner, width: 200, height: 200 },
      { type: 'Path', nameKey: 'material.items.badge', fallbackName: '设计徽章', fill: '#f59e0b', unitPath: PATHS.badge, width: 90, height: 90 },
    ]
  },
  {
    id: 'backgrounds',
    titleKey: 'material.categories.backgrounds',
    fallbackTitle: '精选用图背景',
    items: [
      { type: 'Image', nameKey: 'material.items.bg1', fallbackName: '极光艺术背景', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.bg2', fallbackName: '孟菲斯磨砂图', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.bg3', fallbackName: '大理石白纹理', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600', width: 800, height: 1200 },
    ]
  }
]

// ─────────────────────────────────────────────────
// Inline SVG previews for shapes (replaces icon)
// ─────────────────────────────────────────────────
function ShapePreview({ type, fill, unitPath, corners, innerRadius, cornerRadius }: any) {
  if (type === 'Path' && unitPath) {
    return (
      <svg viewBox="0 0 100 100" className="w-7 h-7 mb-0.5">
        <path d={unitPath} fill={fill || '#3b82f6'} />
      </svg>
    )
  }
  if (type === 'Ellipse') {
    return (
      <svg viewBox="0 0 100 100" className="w-7 h-7 mb-0.5">
        <ellipse cx="50" cy="50" rx="48" ry="48" fill={fill || '#ef4444'} />
      </svg>
    )
  }
  if (type === 'Star') {
    const pts = corners || 5
    const outer = 48, inner = outer * (innerRadius || 0.45), cx = 50, cy = 50
    const pointsStr = Array.from({ length: pts * 2 }, (_, i) => {
      const r = i % 2 === 0 ? outer : inner
      const angle = (Math.PI / pts) * i - Math.PI / 2
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
    return (
      <svg viewBox="0 0 100 100" className="w-7 h-7 mb-0.5">
        <polygon points={pointsStr} fill={fill || '#f59e0b'} />
      </svg>
    )
  }
  if (type === 'Text') {
    return <Type className="w-6 h-6 mb-0.5 text-sky-400" />
  }
  if (type === 'Image') {
    return <ImageIcon className="w-6 h-6 mb-0.5 text-pink-400" />
  }
  // Rect
  return (
    <svg viewBox="0 0 100 60" className="w-7 h-5 mb-0.5">
      <rect x="3" y="3" width="94" height="54" rx={cornerRadius ? 10 : 2} fill={fill || '#3b82f6'} />
    </svg>
  )
}

export function MaterialPanel({ searchFilter = '', mode = 'components' }: { searchFilter?: string; mode?: 'components' | 'assets' }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'text-nodes': true, 'basic-shapes': true, stickers: true, backgrounds: true })

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const filtered = useMemo(() => {
    let cats = CATEGORIES
    if (mode === 'components') {
      cats = CATEGORIES.filter(cat => ['text-nodes', 'basic-shapes'].includes(cat.id))
    } else if (mode === 'assets') {
      cats = CATEGORIES.filter(cat => ['stickers', 'backgrounds'].includes(cat.id))
    }

    if (!searchFilter.trim()) return cats
    const q = searchFilter.toLowerCase()
    return cats.map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        const name = tr(item.nameKey, item.fallbackName).toLowerCase()
        return name.includes(q) || item.type.toLowerCase().includes(q)
      })
    })).filter(cat => cat.items.length > 0)
  }, [searchFilter, mode, t])

  const handleDragStart = (e: React.DragEvent, material: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...material, isMaterial: true }))
  }

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="flex flex-col w-full pb-4">
      {filtered.length === 0 && (
        <div className="text-center text-editor-text-dim text-xs py-8">{tr('material.noMatch', '未找到匹配')}</div>
      )}
      {filtered.map(cat => (
        <div key={cat.id} className="mb-0.5">
          <button
            onClick={() => toggle(cat.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-editor-text-label hover:text-white hover:bg-editor-surface transition-colors"
          >
            <span>{expanded[cat.id] ? '▼' : '▶'} {tr(cat.titleKey, cat.fallbackTitle)}</span>
            {expanded[cat.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {(expanded[cat.id] || searchFilter) && (
            <div className="grid grid-cols-3 gap-1 px-2 pb-2">
              {cat.items.map((mat: any, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => handleDragStart(e, mat)}
                  onClick={() => {
                    useEditorStore.getState().addNode({
                      id: `${mat.type.toLowerCase()}-${Date.now()}`,
                      type: mat.type,
                      x: 100 + Math.random() * 200,
                      y: 100 + Math.random() * 200,
                      width: mat.width || 100,
                      height: mat.height || 100,
                      fill: mat.fill,
                      text: mat.text,
                      url: mat.url,
                      unitPath: mat.unitPath,
                      corners: mat.corners,
                      innerRadius: mat.innerRadius,
                      cornerRadius: mat.cornerRadius,
                      animation: mat.animation,
                      props: mat.props,
                    } as any)
                  }}
                  className="flex flex-col items-center justify-center h-[66px] cursor-pointer text-center rounded bg-editor-deep hover:bg-editor-surface hover:border hover:border-blue-600/60 border border-transparent transition-all"
                >
                  <ShapePreview {...mat} />
                  <span className="text-[9px] text-editor-text-label leading-tight px-0.5 w-full text-center overflow-hidden text-ellipsis whitespace-nowrap">{tr(mat.nameKey, mat.fallbackName)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {mode === 'assets' && (
        <div className="mx-3 mt-3 border border-dashed border-border rounded hover:border-blue-500 transition-colors">
          <label className="flex flex-col items-center justify-center py-3 cursor-pointer text-xs text-muted-foreground hover:text-blue-400 transition-colors">
            <Upload className="w-4 h-4 mb-1" />
            <span className="text-[10px]">{tr('material.uploadImage', '上传外部贴纸')}</span>
            <input type="file" accept="image/*,.svg" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  useEditorStore.getState().addNode({ id: `image-${Date.now()}`, type: 'Image', url: ev.target?.result as string, x: 50, y: 50, width: 250, height: 250 })
                }
                reader.readAsDataURL(file)
              }}
            />
          </label>
        </div>
      )}
    </div>
  )
}
