import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Download, X, Plus, Trash2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'
import { Leafer } from 'leafer-ui'
import { bgColorToFill, createLeaferNode } from '@/core/leafer/runtime'
import { resolveExportDataUrl } from '@/core/export/ExportResultAdapter'
import { saveFileNativeOrBrowser } from '@/lib/fileSave'
import { createExportWatermark } from '@/core/branding'

interface BatchRow {
  id: string
  title: string
  price: string
  subTitle: string
  qrUrl: string
}

interface BatchExportModalProps {
  open: boolean
  onClose: () => void
}

export function BatchExportModal({ open, onClose }: BatchExportModalProps) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  const [rows, setRows] = useState<BatchRow[]>([
    { id: '1', title: '夏日冰爽柠柠檬茶', price: '¥ 12.9', subTitle: '特惠 8 折 · 限时立减', qrUrl: 'https://postercraft.app/p1' },
    { id: '2', title: '满杯红柚啵啵冰', price: '¥ 18.0', subTitle: '买一送一 · 镇店之宝', qrUrl: 'https://postercraft.app/p2' },
    { id: '3', title: '黑糖珍珠鲜奶茶', price: '¥ 15.5', subTitle: '新品上市 · 浓郁口感', qrUrl: 'https://postercraft.app/p3' },
  ])

  if (!open) return null

  const handleAddRow = () => {
    const newId = String(Date.now())
    setRows(prev => [
      ...prev,
      { id: newId, title: `自定义特惠海报 #${prev.length + 1}`, price: '¥ 9.9', subTitle: '第二件半价', qrUrl: `https://postercraft.app/p${newId}` },
    ])
  }

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      feedback.notify({ title: tr('batch.minOneRow', '至少保留 1 条数据'), tone: 'warning' })
      return
    }
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const handleUpdateRow = (id: string, field: keyof BatchRow, val: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  // Perform Batch Rendering and Export
  const handleBatchExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    const { elements, canvasConfig, projectName } = useEditorStore.getState()
    const { width: posterW, height: posterH, bgColor } = canvasConfig
    const exportBounds = { x: 0, y: 0, width: posterW, height: posterH }
    const scale = 2

    let successCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      setExportProgress(Math.round(((i + 1) / rows.length) * 100))

      // Clone elements and replace variables
      const rowElements = elements.map(el => {
        if (el.type === 'Text') {
          let textVal = el.text || ''
          // If node has specific keywords or first text node, replace dynamically
          if (el.id.includes('title') || textVal.includes('夏日') || textVal.includes('特饮') || textVal.includes('大促')) {
            textVal = row.title
          } else if (el.id.includes('price') || textVal.includes('¥') || textVal.includes('元')) {
            textVal = row.price
          } else if (el.id.includes('sub') || textVal.includes('优惠') || textVal.includes('折扣')) {
            textVal = row.subTitle
          }
          return { ...el, text: textVal }
        }
        if (el.type === 'QRCode' && row.qrUrl) {
          return { ...el, text: row.qrUrl }
        }
        return el
      })

      // Offscreen render & export
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-99999px'
      container.style.top = '-99999px'
      container.style.width = `${posterW}px`
      container.style.height = `${posterH}px`
      document.body.appendChild(container)

      let offscreenLeafer: Leafer | null = null

      try {
        offscreenLeafer = new Leafer({
          view: container,
          width: posterW,
          height: posterH,
          fill: bgColorToFill(bgColor),
          pixelRatio: scale,
        })

        rowElements.forEach((el, index) => {
          try {
            const node = createLeaferNode({ ...el, zIndex: index }, { editable: false, draggable: false })
            node.zIndex = index
            offscreenLeafer?.add(node)
          } catch (_err) {}
        })
        offscreenLeafer.add(createExportWatermark(posterW, posterH))

        await new Promise(r => setTimeout(r, 100))

        const exportResult = await offscreenLeafer.export(`${projectName || 'batch'}_${i + 1}.png`, {
          scale,
          screenshot: exportBounds,
        })
        const dataUrl = resolveExportDataUrl(exportResult, 'image/png', 0.95)

        if (dataUrl && dataUrl !== 'saved') {
          const fileName = `${projectName || 'poster'}_batch_${i + 1}.png`
          const saved = await saveFileNativeOrBrowser({
            filename: fileName,
            data: dataUrl,
            mimeType: 'image/png',
            filters: [{ name: 'PNG Image', extensions: ['png'] }],
          })
          if (saved) successCount++
        }
      } catch (err) {
        console.error('Batch export item error:', err)
      } finally {
        if (offscreenLeafer) try { offscreenLeafer.destroy() } catch (_e) {}
        try { document.body.removeChild(container) } catch (_e) {}
      }

      await new Promise(r => setTimeout(r, 150))
    }

    setIsExporting(false)
    feedback.notify({
      title: tr('batch.exportComplete', '批量海报生成导出完成！'),
      description: tr('batch.exportCompleteDesc', `已成功生成并下载 ${successCount} 张高清海报图片`),
      tone: 'success',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                {tr('batch.title', '✨ 批量海报套打生成器 (Batch Generator)')}
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {tr('batch.subtitle', '一次性生成多张不同文本与二维码的海报，支持批量变动替换与高清打包导出。')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Action bar */}
        <div className="p-3 border-b border-border bg-muted/10 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground flex items-center gap-1">
            {tr('batch.pendingList', `待替换数据列表 (${rows.length} 组)`).replace('{{count}}', String(rows.length))}
          </span>
          <Button size="sm" variant="outline" onClick={handleAddRow} className="text-xs h-7 gap-1">
            <Plus className="w-3.5 h-3.5" />
            {tr('batch.addRow', '新增一行数据')}
          </Button>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="p-3 rounded-lg border border-border bg-card/60 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
              <span className="w-6 h-6 rounded bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                #{index + 1}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 w-full text-xs">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">{tr('batch.mainTitle', '主标题文本')}</label>
                  <input
                    type="text"
                    value={row.title}
                    onChange={e => handleUpdateRow(row.id, 'title', e.target.value)}
                    className="w-full h-7 bg-background border border-border rounded px-2 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">{tr('batch.price', '价格 / 优惠数值')}</label>
                  <input
                    type="text"
                    value={row.price}
                    onChange={e => handleUpdateRow(row.id, 'price', e.target.value)}
                    className="w-full h-7 bg-background border border-border rounded px-2 text-xs focus:border-indigo-500 outline-none font-bold text-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">{tr('batch.subTitle', '副标题 / 描述')}</label>
                  <input
                    type="text"
                    value={row.subTitle}
                    onChange={e => handleUpdateRow(row.id, 'subTitle', e.target.value)}
                    className="w-full h-7 bg-background border border-border rounded px-2 text-xs focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5 font-semibold">{tr('batch.qrUrl', '二维码跳转 URL')}</label>
                  <input
                    type="text"
                    value={row.qrUrl}
                    onChange={e => handleUpdateRow(row.id, 'qrUrl', e.target.value)}
                    className="w-full h-7 bg-background border border-border rounded px-2 text-xs focus:border-indigo-500 outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRow(row.id)}
                className="w-7 h-7 text-muted-foreground hover:text-rose-500 shrink-0 self-end sm:self-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Footer Progress & Action */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isExporting ? (
            <div className="flex-1 w-full flex items-center gap-3">
              <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${exportProgress}%` }} />
              </div>
              <span className="text-xs font-bold text-indigo-400 font-mono">{exportProgress}%</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {tr('batch.renderingHint', `共将批量离屏渲染并下载 ${rows.length} 张高清海报图`).replace('{{count}}', String(rows.length))}
            </span>
          )}

          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isExporting} className="text-xs">
              {tr('common.cancel', '取消')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleBatchExport}
              disabled={isExporting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting
                ? tr('batch.exporting', `正在生成 (${exportProgress}%)...`).replace('{{progress}}', String(exportProgress))
                : tr('batch.startBatchExport', '🚀 开始批量一键导出')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
