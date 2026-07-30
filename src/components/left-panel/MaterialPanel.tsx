import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Type, Upload, ChevronDown, ChevronRight, Image as ImageIcon, QrCode, Barcode, Trash2, Sparkles, Folder, FolderPlus, FolderOpen, Grid, Pencil } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import {
  getAssetFolders,
  createAssetFolder,
  deleteAssetFolder,
  getUserAssetsPaged,
  saveUserAsset,
  deleteUserAsset,
  renameUserAsset,
  type UserAsset,
  type AssetFolder,
} from '@/lib/assetDatabase'
import { useFeedback } from '@/lib/feedback'
import { ListContextMenu } from '@/components/ui/list-context-menu'

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
    id: 'preset-hd-images',
    titleKey: 'material.categories.presetHdImages',
    fallbackTitle: '海报摄影高清原画集',
    items: [
      { type: 'Image', nameKey: 'material.items.hd1', fallbackName: '清明 · 春绿竹风背景', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd2', fallbackName: '元宵 · 红灯笼喜庆', url: 'https://images.unsplash.com/photo-1543783232-f72f06aa02bd?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd3', fallbackName: '中秋 · 金色明月宫殿', url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd4', fallbackName: '新春 · 烫金祥龙剪纸', url: 'https://images.unsplash.com/photo-1548625361-185121c27c62?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd5', fallbackName: '六一 · 彩虹梦幻天空', url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd6', fallbackName: '双11 · 霓虹时尚光轨', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd7', fallbackName: '618 · 爆款潮流球鞋', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=90&w=1600', width: 600, height: 480 },
      { type: 'Image', nameKey: 'material.items.hd8', fallbackName: '新品 · 赛博夜景都市', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd9', fallbackName: '国潮 · 水墨禅意茶道', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd10', fallbackName: '招聘 · 极客科技机房', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd11', fallbackName: '美食 · 深夜食堂夜市', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=90&w=2000', width: 800, height: 1200 },
      { type: 'Image', nameKey: 'material.items.hd12', fallbackName: '美食 · 阳光棕榈海滩', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=90&w=2000', width: 800, height: 1200 },
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
  const [assetContextMenu, setAssetContextMenu] = useState<{ x: number; y: number; asset: UserAsset } | null>(null)

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

  const handleUploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const folderId = activeFolderId || folders[0]?.id || 'folder-default'
    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await saveUserAsset(files[i], folderId)
      }
      setActiveFolderId(folderId)
      await loadPageData(folderId, 1, true)
      feedback.notify({
        title: tr('material.uploadSuccess', '素材已导入'),
        description: tr('material.uploadSuccessDesc', '已保存到当前素材目录，可拖拽到画布使用。'),
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
      feedback.notify({
        title: tr('material.uploadFailed', '素材导入失败'),
        description: tr('material.uploadFailedDesc', '请确认文件为可读取的图片格式。'),
        tone: 'error',
      })
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleDeleteAsset = async (asset: UserAsset, e?: React.MouseEvent) => {
    e?.stopPropagation()
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

  const handleRenameAsset = async (asset: UserAsset) => {
    const nextName = await feedback.prompt({
      title: '重命名素材',
      description: '请输入素材名称，方便后续查找和使用。',
      defaultValue: asset.name,
      placeholder: '素材名称',
      confirmLabel: '保存',
      cancelLabel: '取消',
      tone: 'info',
      validate: (value) => (value.trim() ? null : '名称不能为空'),
    })
    if (!nextName || nextName.trim() === asset.name) return
    try {
      await renameUserAsset(asset.id, nextName)
      await loadPageData(activeFolderId, 1, true)
      feedback.notify({ title: '素材名称已更新', description: nextName.trim(), tone: 'success' })
    } catch (error) {
      console.error(error)
      feedback.notify({ title: '素材重命名失败', tone: 'error' })
    }
  }

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const filtered = useMemo(() => {
    if (mode === 'assets') return []
    let cats = CATEGORIES
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
  const activeFolderName = folders.find((folder) => folder.id === activeFolderId)?.name || tr('material.defaultFolder', '默认素材目录')

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* IndexedDB User Asset Gallery Section with Folder Directories */}
      {(mode === 'assets' || !mode) && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header & Create Folder */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-1.5 shrink-0">
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
            <div className="mx-2 mb-2 p-2 bg-muted/40 border border-border rounded-md flex items-center gap-1.5 animate-in fade-in-0 shrink-0">
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

          <div className="mx-2 mb-2 flex items-center gap-2 rounded-md border border-border/60 bg-editor-deep/70 px-2 py-1.5 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-bold text-editor-text">
                {tr('material.currentFolder', '当前目录')}: {activeFolderName}
              </div>
              <div className="truncate text-[10px] text-editor-text-dim">
                {tr('material.uploadHint', '先选择目录，再导入 Logo、商品图或贴纸。')}
              </div>
            </div>
            <label
              className={`inline-flex h-7 shrink-0 items-center gap-1 rounded border px-2 text-[11px] font-bold transition-colors ${
                isUploading
                  ? 'cursor-wait border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : 'cursor-pointer border-blue-500/40 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200'
              }`}
            >
              <Upload className="h-3 w-3" />
              {isUploading ? tr('material.uploading', '导入中') : tr('material.uploadToCurrent', '导入素材')}
              <input
                type="file"
                accept="image/*,.svg"
                multiple
                className="hidden"
                onChange={handleUploadAsset}
                disabled={isUploading || folders.length === 0}
              />
            </label>
          </div>

          {/* Foldable Folder Directories - Stretch to Fill Height */}
          <div className="flex-1 flex flex-col min-h-0 space-y-1.5 px-1 pb-2 overflow-y-auto">
            {folders.map((folder) => {
              const isExpanded = expanded[folder.id] ?? (folder.id === activeFolderId)
              const isActive = folder.id === activeFolderId

              return (
                <div key={folder.id} className={`border border-border/60 rounded-md overflow-hidden bg-card/60 flex flex-col ${isActive && isExpanded ? 'flex-1 min-h-0' : 'shrink-0'}`}>
                  {/* Folder Header Bar */}
                  <div
                    onClick={() => {
                      setActiveFolderId(folder.id)
                      toggle(folder.id)
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 text-xs font-bold cursor-pointer transition-colors shrink-0 ${
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

                  {/* Folder Asset Grid (Expanded View - Stretches to Fill Panel Bottom) */}
                  {isExpanded && isActive && (
                    <div className="flex-1 flex flex-col min-h-0 p-2 bg-muted/10">
                      {userAssets.length > 0 && (
                        <div
                          onScroll={handleScrollWaterfall}
                          className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1.5 min-h-0"
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
                                onContextMenu={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setAssetContextMenu({ x: event.clientX, y: event.clientY, asset })
                                }}
                                className="group relative break-inside-avoid flex flex-col items-center justify-center p-1 bg-card border border-border hover:border-blue-500 rounded cursor-grab active:cursor-grabbing hover:shadow-md transition-all overflow-hidden mb-1.5"
                                title={`${asset.name} (${asset.width}x${asset.height}) - ${tr('material.dragToUse', '拖拽至画布使用')}`}
                              >
                                <img
                                  src={asset.thumbnailUrl}
                                  alt={asset.name}
                                  className="block w-full h-auto object-cover rounded"
                                />
                                <div className="w-full min-w-0 px-0.5 pt-1 text-left">
                                  <div
                                    className="truncate text-[10px] font-medium leading-4 text-foreground"
                                    title={asset.name}
                                  >
                                    {asset.name}
                                  </div>
                                  <div className="truncate text-[9px] font-mono leading-3 text-muted-foreground" title={`${asset.width}x${asset.height}`}>
                                    {asset.width}x{asset.height}
                                  </div>
                                </div>
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

      {mode === 'components' && filtered.map(cat => {
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

      {assetContextMenu && (
        <ListContextMenu
          pos={assetContextMenu}
          onClose={() => setAssetContextMenu(null)}
          actions={[
            {
              label: '重命名素材',
              icon: Pencil,
              onClick: () => { void handleRenameAsset(assetContextMenu.asset) },
            },
            {
              label: '删除素材',
              icon: Trash2,
              tone: 'danger',
              onClick: () => { void handleDeleteAsset(assetContextMenu.asset) },
            },
          ]}
        />
      )}

    </div>
  )
}
