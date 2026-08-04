import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Type, Upload, ChevronDown, ChevronRight, Image as ImageIcon, QrCode, Barcode, Trash2, Folder, FolderPlus, FolderOpen, Grid, Pencil } from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import {
  getAssetFolders,
  createAssetFolder,
  deleteAssetFolder,
  renameAssetFolder,
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
  retroStar:     'M50 5 Q50 50 5 50 Q50 50 50 95 Q50 50 95 50 Q50 50 50 5 Z',
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
  return (
    <svg viewBox="0 0 100 60" className="w-7 h-5 mb-0.5">
      <rect x="3" y="3" width="94" height="54" rx={cornerRadius ? 10 : 2} fill={fill || '#3b82f6'} />
    </svg>
  )
}

export function MaterialPanel({ searchFilter = '', mode = 'components' }: { searchFilter?: string; mode?: 'components' | 'assets' }) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const [folders, setFolders] = useState<AssetFolder[]>([])
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Map of assets for each folder ID (independent per-folder caching)
  const [folderAssetsMap, setFolderAssetsMap] = useState<Record<string, { items: UserAsset[]; total: number }>>({})

  // Multi-folder expansion state (all folders expanded by default)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [isUploading, setIsUploading] = useState(false)
  const [assetContextMenu, setAssetContextMenu] = useState<{ x: number; y: number; asset: UserAsset } | null>(null)

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const loadFolderAssets = async (folderId: string) => {
    try {
      const res = await getUserAssetsPaged(folderId, 1, 100)
      setFolderAssetsMap((prev) => ({
        ...prev,
        [folderId]: { items: res.items, total: res.total },
      }))
    } catch (e) {
      console.error(e)
    }
  }

  const reloadAllFolderAssets = async (list: AssetFolder[]) => {
    for (const f of list) {
      await loadFolderAssets(f.id)
    }
  }

  const reloadFolders = async () => {
    try {
      const list = await getAssetFolders()
      setFolders(list)
      // Initialize expanded state for new folders (default expanded)
      setExpanded((prev) => {
        const next = { ...prev }
        list.forEach((f) => {
          if (next[f.id] === undefined) next[f.id] = true
        })
        return next
      })
      await reloadAllFolderAssets(list)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    reloadFolders()
  }, [])

  const isAllExpanded = useMemo(() => {
    return folders.length > 0 && folders.every((f) => expanded[f.id] !== false)
  }, [folders, expanded])

  const toggleAllFolders = () => {
    const nextState = !isAllExpanded
    const updated: Record<string, boolean> = {}
    folders.forEach((f) => {
      updated[f.id] = nextState
    })
    setExpanded((prev) => ({ ...prev, ...updated }))
  }

  const toggleFolder = (folderId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
    if (!folderAssetsMap[folderId]) {
      loadFolderAssets(folderId)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const folder = await createAssetFolder(newFolderName.trim())
      setNewFolderName('')
      setShowFolderInput(false)
      await reloadFolders()
      setExpanded((prev) => ({ ...prev, [folder.id]: true }))
      feedback.notify({
        title: '目录创建成功',
        description: `已新建素材分类目录「${folder.name}」`,
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleRenameFolder = async (folder: AssetFolder, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const nextName = await feedback.prompt({
      title: '重命名素材目录',
      description: '请输入新的素材目录名称。',
      defaultValue: folder.name,
      placeholder: '目录名称',
      confirmLabel: '保存',
      cancelLabel: '取消',
      tone: 'info',
      validate: (value) => (value.trim() ? null : '名称不能为空'),
    })
    if (!nextName || nextName.trim() === folder.name) return
    try {
      await renameAssetFolder(folder.id, nextName.trim())
      await reloadFolders()
      feedback.notify({
        title: '目录重命名成功',
        description: `素材目录已更名为「${nextName.trim()}」`,
        tone: 'success',
      })
    } catch (err) {
      console.error(err)
      feedback.notify({ title: '目录重命名失败', tone: 'error' })
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

  const handleUploadAssetToFolder = async (folderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await saveUserAsset(files[i], folderId)
      }
      await loadFolderAssets(folderId)
      feedback.notify({
        title: tr('material.uploadSuccess', '素材已导入'),
        description: tr('material.uploadSuccessDesc', '已保存到素材目录，可拖拽到画布使用。'),
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
      await loadFolderAssets(asset.folderId)
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
      await loadFolderAssets(asset.folderId)
      feedback.notify({ title: '素材名称已更新', description: nextName.trim(), tone: 'success' })
    } catch (error) {
      console.error(error)
      feedback.notify({ title: '素材重命名失败', tone: 'error' })
    }
  }

  const filteredPresetCategories = useMemo(() => {
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

  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {/* IndexedDB User Asset Gallery Section with Multi-Folder Directory List */}
      {(mode === 'assets' || !mode) && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header & Directory Actions */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{tr('material.folderGallery', '素材目录库')}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleAllFolders}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded border border-border/60 bg-card hover:bg-muted cursor-pointer select-none"
              >
                {isAllExpanded ? tr('template.collapseAll', '全部折叠') : tr('template.expandAll', '全部展开')}
              </button>
              <button
                type="button"
                onClick={() => setShowFolderInput((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors cursor-pointer select-none"
              >
                <FolderPlus className="w-3 h-3" />
                {tr('material.newDirectory', '新建目录')}
              </button>
            </div>
          </div>

          {/* New Folder Inline Form */}
          {showFolderInput && (
            <div className="mx-2 my-2 p-2 bg-muted/40 border border-border rounded-md flex items-center gap-1.5 animate-in fade-in-0 shrink-0">
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
                className="px-2.5 h-7 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded cursor-pointer"
              >
                {tr('common.save', '确定')}
              </button>
            </div>
          )}

          {/* Multi-Folder Directory Item List (Matches Template Panel Sticky Header & Independent Expansion) */}
          <div className="flex-1 px-1.5 pb-2 pt-0 overflow-y-auto space-y-2">
            {folders.map((folder) => {
              const isExpanded = expanded[folder.id] !== false
              const folderData = folderAssetsMap[folder.id] || { items: [], total: 0 }
              const items = folderData.items

              return (
                <div key={folder.id} className="border border-border/70 rounded-lg bg-card/60 shadow-2xs flex flex-col">
                  {/* Category Directory Sticky Header */}
                  <div
                    onClick={() => toggleFolder(folder.id)}
                    className="sticky top-0 z-20 flex items-center justify-between px-3 py-2 text-xs font-bold cursor-pointer transition-colors select-none bg-card hover:bg-muted/80 border-b border-border/40 rounded-t-lg shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-muted-foreground text-[11px] shrink-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-foreground text-xs font-bold truncate max-w-[110px]">{folder.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full border border-border/40">
                        {folderData.total}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Upload button inside folder header */}
                      <label
                        className="p-1 text-muted-foreground hover:text-emerald-400 transition-colors cursor-pointer"
                        title={tr('material.uploadToCurrent', '导入素材到该目录')}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*,.svg"
                          multiple
                          className="hidden"
                          onChange={(e) => handleUploadAssetToFolder(folder.id, e)}
                          disabled={isUploading}
                        />
                      </label>

                      {/* Rename folder button */}
                      <button
                        type="button"
                        onClick={(e) => handleRenameFolder(folder, e)}
                        className="p-1 text-muted-foreground hover:text-blue-400 transition-colors cursor-pointer"
                        title={tr('material.renameFolder', '重命名素材目录')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {folder.id !== 'folder-default' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteFolder(folder, e)}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                          title={tr('material.deleteDirHint', '删除目录及其全部素材')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Directory Asset Grid (Expanded View) */}
                  {isExpanded && (
                    <div className="p-2 bg-muted/10 rounded-b-lg">
                      {items.length === 0 ? (
                        <div className="text-center text-muted-foreground text-[11px] py-4 italic">
                          {tr('material.emptyFolderHint', '暂无素材，点击右上角图标导入')}
                        </div>
                      ) : (
                        <div className="columns-2 gap-1.5 space-y-1.5">
                          {items.map((asset) => (
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
                              className="group relative break-inside-avoid bg-card border border-border hover:border-emerald-500 rounded-md overflow-hidden p-1 shadow-2xs hover:shadow-md transition-all cursor-pointer"
                              title={`${asset.name} (${asset.width}x${asset.height}) - ${tr('material.dragToUse', '拖拽至画布使用')}`}
                            >
                              <img
                                src={asset.thumbnailUrl}
                                alt={asset.name}
                                onError={(e) => {
                                  const img = e.currentTarget
                                  if (asset.url && img.src !== asset.url) {
                                    img.src = asset.url
                                  } else {
                                    const card = img.closest('.group') as HTMLElement
                                    if (card) card.style.display = 'none'
                                  }
                                }}
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
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {mode === 'components' && filteredPresetCategories.map(cat => {
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
