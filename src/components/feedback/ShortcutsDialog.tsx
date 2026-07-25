import { Command, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const SHORTCUT_KEYS = [
  { key: 'Alt + 拖拽/点击', id: 'altDrag', fallback: '按住 Alt 键快速复制当前选中图元' },
  { key: 'Ctrl + A', id: 'selectAll', fallback: '全选画布当前所有未锁定图元' },
  { key: 'Ctrl + G', id: 'group', fallback: '一键将选中的多个图元编组 (Group)' },
  { key: 'Ctrl + Shift + G', id: 'ungroup', fallback: '解开选中的图元编组 (Ungroup)' },
  { key: 'Ctrl + L', id: 'lock', fallback: '快速锁定或解锁当前选中图元' },
  { key: 'Ctrl + [ / Ctrl + ]', id: 'layerUpDown', fallback: '下移一层 / 上移一层图元遮挡' },
  { key: 'Ctrl + Shift + [ / ]', id: 'layerTopBottom', fallback: '置底 / 置顶图元遮挡层级' },
  { key: 'Shift + 点击', id: 'shiftClick', fallback: '连续选择/多选多个图元组件' },
  { key: 'Ctrl + Z', id: 'undo', fallback: '撤销上一步操作' },
  { key: 'Ctrl + Y / Ctrl + Shift + Z', id: 'redo', fallback: '重做上一步撤销' },
  { key: 'Ctrl + C / Ctrl + V', id: 'copyPaste', fallback: '复制 / 粘贴图元组件' },
  { key: 'Ctrl + S', id: 'save', fallback: '快速保存海报工程' },
  { key: 'Delete / Backspace', id: 'delete', fallback: '物理删除当前选中的图元' },
  { key: '方向键 (↑ ↓ ← →)', id: 'arrowMove', fallback: '微调选中图元坐标 (1px)' },
  { key: 'Shift + 方向键', id: 'shiftArrowMove', fallback: '快速步进移动图元 (10px)' },
  { key: '双击鼠标中键', id: 'middleClickCenter', fallback: '画布视口自动自适应居中' },
  { key: 'Space + 鼠标拖拽', id: 'spacePan', fallback: '抓手工具平移海报画布' },
  { key: '滚轮 (Wheel)', id: 'wheelZoom', fallback: '画布视口细致放大或缩小' },
]

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const { t } = useTranslation()

  const tr = (key: string, fallback: string) => {
    const val = t(key)
    return val === key ? fallback : val
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Command className="w-4 h-4 text-blue-500" />
            <span>{tr('shortcuts.title', '海报编辑器 - 全快捷键指南全集')}</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {SHORTCUT_KEYS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-muted/40 text-xs">
              <span className="text-muted-foreground">{tr(`shortcuts.${s.id}`, s.fallback)}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-bold text-foreground bg-background border border-border rounded shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <Button variant="default" size="sm" onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
            {tr('shortcuts.gotIt', '知道了')}
          </Button>
        </div>
      </div>
    </div>
  )
}
