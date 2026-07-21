import { Command, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'Alt + 拖拽/点击', desc: '按住 Alt 键快速复制当前选中图元' },
  { key: 'Ctrl + A', desc: '全选画布当前所有未锁定图元' },
  { key: 'Shift + 点击', desc: '连续选择/多选多个图元组件' },
  { key: 'Ctrl + Z', desc: '撤销上一步操作' },
  { key: 'Ctrl + Y / Ctrl + Shift + Z', desc: '重做上一步撤销' },
  { key: 'Ctrl + C', desc: '复制当前选中的图元' },
  { key: 'Ctrl + V', desc: '粘贴剪贴板中的图元' },
  { key: 'Ctrl + S', desc: '快速保存海报工程' },
  { key: 'Delete / Backspace', desc: '删除当前选中的图元' },
  { key: '方向键 (↑ ↓ ← →)', desc: '微调选中图元坐标 (1px)' },
  { key: 'Shift + 方向键', desc: '快速步进移动图元 (10px)' },
  { key: '双击鼠标中键', desc: '画布视口自动自适应居中' },
  { key: 'Space + 鼠标拖拽', desc: '抓手工具平移海报画布' },
  { key: '滚轮 (Wheel)', desc: '画布视口细致放大或缩小' },
]

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-5">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Command className="w-4 h-4 text-blue-500" />
            <span>海报编辑器 - 快捷键指南全集</span>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {SHORTCUTS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-muted/40 text-xs">
              <span className="text-muted-foreground">{s.desc}</span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-bold text-foreground bg-background border border-border rounded shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <Button variant="default" size="sm" onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white text-xs">
            知道了
          </Button>
        </div>
      </div>
    </div>
  )
}
