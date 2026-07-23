import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Type, Upload, ChevronDown, ChevronRight, Image as ImageIcon, QrCode, Barcode, Trash2, Sparkles, Folder, FolderPlus, FolderOpen, Grid } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import {
  getAssetFolders,
  createAssetFolder,
  deleteAssetFolder,
  getUserAssetsPaged,
  saveUserAsset,
  deleteUserAsset,
  type UserAsset,
  type AssetFolder,
} from '@/lib/assetDatabase'
import { useFeedback } from '@/lib/feedback'

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
    id: 'qrcodes',
    titleKey: 'material.categories.qrcodes',
    fallbackTitle: '常用组件',
    items: [
      { type: 'Mosaic', nameKey: 'material.items.mosaic', fallbackName: '马赛克遮罩', width: 200, height: 120, props: { pixelSize: 12 } },
      { type: 'QRCode', nameKey: 'material.items.qrcode', fallbackName: '动态二维码', text: 'https://postercraft.app', width: 160, height: 160 },
      { type: 'Barcode', nameKey: 'material.items.barcode', fallbackName: '矢量条形码', text: '690123456789', width: 240, height: 80 },
    ]
  },
  {
    id: 'text-nodes',
    titleKey: 'material.categories.textNodes',
    fallbackTitle: '高级文本排版',
    items: [
      { type: 'Text', nameKey: 'material.items.superTitle', fallbackName: '特大醒目标题', text: 'SUMMER', fill: '#ef4444', width: 360, height: 100, fontSize: 72, props: { fontweight: '900', textalign: 'center' } },
      { type: 'Text', nameKey: 'material.items.titleText', fallbackName: '正标题文本', text: '设计狂欢夜', fill: '#ffffff', width: 260, height: 60, fontSize: 36, props: { fontweight: '700', textalign: 'center' } },
      { type: 'Text', nameKey: 'material.items.subTitleText', fallbackName: '创意副标题', text: 'CREATIVE DESIGN PARTY', fill: '#94a3b8', width: 220, height: 40, fontSize: 16, props: { fontweight: '500', textalign: 'center', letterspacing: '2px' } },
      { type: 'Text', nameKey: 'material.items.comboSale', fallbackName: '组合：5折促销爆款', text: '5折封顶\n全场满199立减50', fill: '#ef4444', width: 280, height: 110, fontSize: 44, props: { fontweight: '900', textalign: 'center', lineheight: '1.2' } },
      { type: 'Text', nameKey: 'material.items.comboInvite', fallbackName: '组合：盛典邀请函', text: 'INVITATION\n2026 年度设计盛典', fill: '#fbbf24', width: 300, height: 90, fontSize: 28, props: { fontweight: '700', textalign: 'center' } },
      { type: 'Text', nameKey: 'material.items.comboGuochao', fallbackName: '组合：国潮招牌文字', text: '国潮崛起\n匠心造物 传承经典', fill: '#f97316', width: 280, height: 100, fontSize: 40, props: { fontweight: '900', textalign: 'center' } },
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
    id: 'marketing-stamps',
    titleKey: 'material.categories.marketingStamps',
    fallbackTitle: '营销爆款印章贴纸',
    items: [
      { type: 'Text', nameKey: 'material.items.stampSale', fallbackName: '限时 5 折爆款章', text: '限时特惠\n5折抢购', fill: '#ef4444', width: 140, height: 140, fontSize: 24, props: { fontweight: '900', textalign: 'center', border: '3px solid #ef4444', borderRadius: '50%', padding: '20px' } },
      { type: 'Text', nameKey: 'material.items.stampHot', fallbackName: '热销推荐 NO.1', text: 'HOT\n爆款热销', fill: '#f59e0b', width: 130, height: 130, fontSize: 22, props: { fontweight: '900', textalign: 'center', border: '3px dashed #f59e0b', borderRadius: '16px', padding: '16px' } },
      { type: 'Text', nameKey: 'material.items.stampAuthentic', fallbackName: '正品保障印章', text: '100%\n正品保障', fill: '#10b981', width: 130, height: 130, fontSize: 20, props: { fontweight: '800', textalign: 'center', border: '3px double #10b981', borderRadius: '50%', padding: '16px' } },
      { type: 'Text', nameKey: 'material.items.stampNew', fallbackName: 'NEW 新品首发', text: 'NEW\n新品上市', fill: '#8b5cf6', width: 130, height: 130, fontSize: 22, props: { fontweight: '900', textalign: 'center', border: '3px solid #8b5cf6', borderRadius: '50%', padding: '16px' } },
      { type: 'Text', nameKey: 'material.items.stampVip', fallbackName: 'VIP 专属特权', text: 'VIP\n专属尊享', fill: '#fbbf24', width: 130, height: 130, fontSize: 22, props: { fontweight: '900', textalign: 'center', border: '3px double #fbbf24', borderRadius: '16px', padding: '16px' } },
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
  if (type === 'Mosaic') {
    return <Grid className="w-7 h-7 text-indigo-400 mb-0.5" />
  }
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
  if (type === 'QRCode') {
    return <QrCode className="w-7 h-7 text-emerald-400 mb-0.5" />
  }
  if (type === 'Barcode') {
    return <Barcode className="w-7 h-7 text-blue-400 mb-0.5" />
  }
  if (type === 'Image') {
    return <ImageIcon className="w-7 h-7 text-pink-400 mb-0.5" />
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'user-assets': true, 'text-nodes': true, 'basic-shapes': true, stickers: true, backgrounds: true, qrcodes: true })
  const feedback = useFeedback()
  const [folders, setFolders] = useState<AssetFolder[]>([])
  const [activeFolderId, setActiveFolderId] = useState<string>('folder-default')
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const [userAssets, setUserAssets] = useState<UserAsset[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const reloadFolders = async () => {
    try {
      const list = await getAssetFolders()
      setFolders(list)
      if (list.length > 0 && !list.some((f) => f.id === activeFolderId)) {
        setActiveFolderId(list[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    reloadFolders()
  }, [])

  const loadPageData = async (folderId: string, targetPage: number, replace = false) => {
    try {
      setIsLoadingMore(true)
      const res = await getUserAssetsPaged(folderId, targetPage, 8)
      setTotalCount(res.total)
      setHasMore(res.hasMore)
      setPage(targetPage)
      if (replace) {
        setUserAssets(res.items)
      } else {
        setUserAssets((prev) => [...prev, ...res.items])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    loadPageData(activeFolderId, 1, true)
  }, [activeFolderId])

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const folder = await createAssetFolder(newFolderName.trim())
      setNewFolderName('')
      setShowFolderInput(false)
      await reloadFolders()
      setActiveFolderId(folder.id)
      feedback.notify({
        title: '目录创建成功',
        description: `已新建素材分类目录「${folder.name}」`,
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteFolder = async (folder: AssetFolder, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await feedback.confirm({
      title: '删除素材目录',
      description: `确定要删除分类目录「${folder.name}」及其下的所有图片素材吗？`,
      confirmLabel: '删除',
      cancelLabel: '取消',
      tone: 'warning',
    })
    if (!confirmed) return
    try {
      await deleteAssetFolder(folder.id)
      await reloadFolders()
      feedback.notify({
        title: '目录已删除',
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleScrollWaterfall = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 40 && hasMore && !isLoadingMore) {
      loadPageData(activeFolderId, page + 1, false)
    }
  }

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>, targetFolderId?: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const folderId = targetFolderId || activeFolderId
    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await saveUserAsset(files[i], folderId)
      }
      if (activeFolderId !== folderId) {
        setActiveFolderId(folderId)
      } else {
        await loadPageData(folderId, 1, true)
      }
      feedback.notify({
        title: '素材上传保存成功',
        description: '已压缩存入选定素材目录，可在面板中随时拖拽使用',
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
      feedback.notify({
        title: '素材保存失败',
        tone: 'error',
      })
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAsset = async (asset: UserAsset, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await feedback.confirm({
      title: '删除素材确认',
      description: `确定要从素材数据库中移除「${asset.name}」吗？`,
      confirmLabel: '删除',
      cancelLabel: '取消',
      tone: 'warning',
    })
    if (!confirmed) return
    try {
      await deleteUserAsset(asset.id)
      await loadPageData(activeFolderId, 1, true)
      feedback.notify({
        title: '素材已移除',
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const filtered = useMemo(() => {
    let cats = CATEGORIES
    if (mode === 'components') {
      cats = CATEGORIES.filter(cat => ['qrcodes', 'text-nodes', 'basic-shapes', 'marketing-stamps'].includes(cat.id))
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
      {/* IndexedDB User Asset Gallery Section with Folder Directories */}
      {(mode === 'assets' || !mode) && (
        <div className="mb-3 border-b border-border/60 pb-3">
          {/* Header & Create Folder */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{tr('material.folderGallery', '素材目录库')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFolderInput((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors"
            >
              <FolderPlus className="w-3 h-3" />
              {tr('material.newDirectory', '新建目录')}
            </button>
          </div>

          {/* New Folder Inline Form */}
          {showFolderInput && (
            <div className="mx-2 mb-2 p-2 bg-muted/40 border border-border rounded-md flex items-center gap-1.5 animate-in fade-in-0">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={tr('material.directoryNamePlaceholder', '目录名称 (如: 促销标志)')}
                className="flex-1 h-7 bg-background border border-border text-xs rounded px-2 focus:outline-none focus:border-emerald-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-2.5 h-7 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded"
              >
                {tr('common.save', '确定')}
              </button>
            </div>
          )}

          {/* Foldable Folder Directories */}
          <div className="space-y-1 px-1">
            {folders.map((folder) => {
              const isExpanded = expanded[folder.id] ?? (folder.id === activeFolderId)
              const isActive = folder.id === activeFolderId

              return (
                <div key={folder.id} className="border border-border/60 rounded-md overflow-hidden bg-card/60">
                  {/* Folder Header Bar */}
                  <div
                    onClick={() => {
                      setActiveFolderId(folder.id)
                      toggle(folder.id)
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-colors ${
                      isActive ? 'bg-blue-600/10 text-blue-400 border-b border-blue-500/20' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[10px] text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
                      {isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className="truncate max-w-[110px]">{folder.name}</span>
                      {isActive && <span className="text-[10px] font-mono text-muted-foreground">({totalCount})</span>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Upload Button Dedicated to this Folder */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleUploadAsset(e, folder.id)}
                          disabled={isUploading}
                        />
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-xs transition-colors">
                          <Upload className="w-2.5 h-2.5" />
                          {tr('material.uploadImage', '上传图片')}
                        </span>
                      </label>

                      {folder.id !== 'folder-default' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(folder, e)}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                          title={tr('material.deleteDirHint', '删除目录及其全部素材')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Folder Asset Grid (Expanded View) */}
                  {isExpanded && isActive && (
                    <div className="p-2 bg-muted/10">
                      {userAssets.length === 0 ? (
                        <div className="p-3 text-center border border-dashed border-border/50 rounded bg-background/50 text-muted-foreground text-[10px]">
                          {tr('material.emptyDirHint', '目录下暂无图片，点击右侧「上传图片」保存新素材')}
                        </div>
                      ) : (
                        <div
                          onScroll={handleScrollWaterfall}
                          className="max-h-[220px] overflow-y-auto pr-0.5 flex flex-col gap-1.5"
                        >
                          {/* Masonry Waterfall Grid */}
                          <div className="columns-2 gap-1.5 space-y-1.5">
                            {userAssets.map((asset) => (
                              <div
                                key={asset.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData(
                                    'application/json',
                                    JSON.stringify({
                                      type: 'Image',
                                      url: asset.url,
                                      width: asset.width || 300,
                                      height: asset.height || 300,
                                      isMaterial: true,
                                    })
                                  )
                                }}
                                onClick={() => {
                                  useEditorStore.getState().addNode({
                                    id: `image-${Date.now()}`,
                                    type: 'Image',
                                    url: asset.url,
                                    x: 100,
                                    y: 100,
                                    width: asset.width || 300,
                                    height: asset.height || 300,
                                  })
                                  feedback.notify({
                                    title: tr('material.addSuccess', '添加素材成功'),
                                    tone: 'success',
                                  })
                                }}
                                className="group relative break-inside-avoid flex flex-col items-center justify-center p-1 bg-card border border-border hover:border-blue-500 rounded cursor-grab active:cursor-grabbing hover:shadow-md transition-all overflow-hidden mb-1.5"
                                title={`${asset.name} (${asset.width}x${asset.height}) - ${tr('material.dragToUse', '拖拽至画布使用')}`}
                              >
                                <img
                                  src={asset.thumbnailUrl}
                                  alt={asset.name}
                                  className="w-full h-auto object-cover rounded"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAsset(asset, e)}
                                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow"
                                    title={tr('material.deleteFromDb', '从数据库删除素材')}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 truncate px-0.5 pointer-events-none font-mono">
                                  {asset.width}x{asset.height}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Pagination Status */}
                          {isLoadingMore && (
                            <div className="text-center text-[10px] text-blue-400 py-1 font-mono animate-pulse">
                              正在加载下一页...
                            </div>
                          )}
                          {!hasMore && userAssets.length > 0 && (
                            <div className="text-center text-[9px] text-muted-foreground/60 py-0.5 font-mono">
                              已加载全部 {totalCount} 个素材
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {filtered.length === 0 && (
        <div className="text-center text-editor-text-dim text-xs py-8">{tr('material.noMatch', '未找到匹配')}</div>
      )}
      {filtered.map(cat => {
        const isCatExpanded = expanded[cat.id] ?? true
        return (
          <div key={cat.id} className="mb-0.5">
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [cat.id]: !isCatExpanded }))}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-editor-text-label hover:text-white hover:bg-editor-surface transition-colors"
            >
              <span>{isCatExpanded ? '▼' : '▶'} {tr(cat.titleKey, cat.fallbackTitle)}</span>
              {isCatExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {(isCatExpanded || searchFilter) && (
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
      )
    })}

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
