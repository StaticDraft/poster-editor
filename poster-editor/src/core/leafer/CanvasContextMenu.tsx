import { useTranslation } from 'react-i18next'
import {
  Copy, ClipboardPaste, BringToFront, SendToBack, Trash2,
  Scissors, Undo2, Redo2, ChevronUp, ChevronDown,
  Lock, Unlock, Group, Ungroup,
} from 'lucide-react'
import { useEditorStore } from '@/store/useEditorStore'
import { useFeedback } from '@/lib/feedback'

interface Props {
  pos: { x: number; y: number }
  onClose: () => void
}

export function CanvasContextMenu({ pos, onClose }: Props) {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const deleteNodes = useEditorStore((state) => state.deleteNodes)
  const activeIds = useEditorStore((state) => state.activeIds)
  const elements = useEditorStore((state) => state.elements)
  const clipboard = useEditorStore((state) => state.clipboard)
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)
  const updateNodes = useEditorStore((state) => state.updateNodes)
  const tr = (key: string, fallback: string) => {
    const text = t(key)
    return text === key ? fallback : text
  }
  const selectedNodes = elements.filter((item) => activeIds.includes(item.id))
  const hasSelection = selectedNodes.length > 0
  const allLocked = hasSelection && selectedNodes.every(n => n.locked)
  const hasGroup = hasSelection && selectedNodes.some(n => n.groupId)

  // ── Handlers ──

  const handleUndo = () => {
    useEditorStore.getState().undo()
    onClose()
  }

  const handleRedo = () => {
    useEditorStore.getState().redo()
    onClose()
  }

  const handleCopy = () => {
    if (!hasSelection) {
      feedback.notify({
        title: tr('contextMenu.copyEmpty', 'Nothing to copy'),
        description: tr('contextMenu.copyEmptyDesc', 'Select at least one node before copying.'),
        tone: 'warning',
      })
      onClose()
      return
    }
    useEditorStore.getState().copy()
    onClose()
  }

  const handleCut = () => {
    if (!hasSelection) {
      feedback.notify({
        title: tr('contextMenu.cutEmpty', '无可剪切内容'),
        description: tr('contextMenu.cutEmptyDesc', '请先选中至少一个图元。'),
        tone: 'warning',
      })
      onClose()
      return
    }
    useEditorStore.getState().cut()
    onClose()
  }

  const handlePaste = () => {
    if (clipboard.length === 0) {
      feedback.notify({
        title: tr('contextMenu.pasteEmpty', 'Clipboard is empty'),
        description: tr('contextMenu.pasteEmptyDesc', 'Copy nodes before pasting.'),
        tone: 'warning',
      })
      onClose()
      return
    }
    useEditorStore.getState().paste()
    onClose()
  }

  const handleBringToFront = () => {
    if (!hasSelection) return onClose()
    useEditorStore.getState().bringToFront()
    onClose()
  }

  const handleSendToBack = () => {
    if (!hasSelection) return onClose()
    useEditorStore.getState().sendToBack()
    onClose()
  }

  const handleMoveForward = () => {
    if (!hasSelection) return onClose()
    useEditorStore.getState().moveForward()
    onClose()
  }

  const handleMoveBackward = () => {
    if (!hasSelection) return onClose()
    useEditorStore.getState().moveBackward()
    onClose()
  }

  const handleToggleLock = () => {
    if (!hasSelection) return onClose()
    updateNodes(activeIds, { locked: !allLocked } as any)
    onClose()
  }

  const handleGroup = () => {
    if (activeIds.length < 2) return onClose()
    const groupId = `group-${Date.now()}`
    updateNodes(activeIds, { groupId } as any)
    onClose()
  }

  const handleUngroup = () => {
    if (!hasSelection) return onClose()
    updateNodes(activeIds, { groupId: undefined } as any)
    onClose()
  }

  // ── Menu item helpers ──

  const MenuItem = ({ icon: Icon, label, onClick, disabled, shortcut, className = '' }: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    disabled?: boolean
    shortcut?: string
    className?: string
  }) => (
    <div
      className={`px-3 py-1.5 cursor-pointer flex items-center font-medium transition-colors ${disabled ? 'opacity-30 pointer-events-none' : 'hover:bg-muted'} ${className}`}
      onClick={disabled ? undefined : onClick}
    >
      <Icon className="w-3.5 h-3.5 mr-2.5 shrink-0" />
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-muted-foreground ml-4 font-mono">{shortcut}</span>}
    </div>
  )

  const Divider = () => <div className="h-px bg-border/50 my-1" />

  return (
    <div
      className="fixed z-[100] bg-card border border-border shadow-xl rounded-md py-1.5 min-w-[210px] text-xs text-foreground"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => { e.stopPropagation(); onClose() }}
      onContextMenu={e => { e.preventDefault(); onClose() }}
    >
      {/* Undo / Redo */}
      <MenuItem icon={Undo2} label={tr('contextMenu.undo', '撤销')} onClick={handleUndo} disabled={!canUndo} shortcut="Ctrl+Z" className="text-primary" />
      <MenuItem icon={Redo2} label={tr('contextMenu.redo', '重做')} onClick={handleRedo} disabled={!canRedo} shortcut="Ctrl+Y" className="text-primary" />

      <Divider />

      {/* Copy / Cut / Paste */}
      <MenuItem icon={Copy} label={t('contextMenu.copy')} onClick={handleCopy} disabled={!hasSelection} shortcut="Ctrl+C" />
      <MenuItem icon={Scissors} label={tr('contextMenu.cut', '剪切')} onClick={handleCut} disabled={!hasSelection} shortcut="Ctrl+X" />
      <MenuItem icon={ClipboardPaste} label={t('contextMenu.paste')} onClick={handlePaste} disabled={clipboard.length === 0} shortcut="Ctrl+V" />

      <Divider />

      {/* Layer order */}
      <MenuItem icon={BringToFront} label={t('contextMenu.bringToFront')} onClick={handleBringToFront} disabled={!hasSelection} className="text-blue-500" />
      <MenuItem icon={ChevronUp} label={tr('contextMenu.moveForward', '上移一层')} onClick={handleMoveForward} disabled={!hasSelection} className="text-blue-500" />
      <MenuItem icon={ChevronDown} label={tr('contextMenu.moveBackward', '下移一层')} onClick={handleMoveBackward} disabled={!hasSelection} className="text-blue-500" />
      <MenuItem icon={SendToBack} label={t('contextMenu.sendToBack')} onClick={handleSendToBack} disabled={!hasSelection} className="text-blue-500" />

      <Divider />

      {/* Lock / Group */}
      <MenuItem
        icon={allLocked ? Unlock : Lock}
        label={allLocked ? tr('contextMenu.unlock', '解锁图层') : tr('contextMenu.lock', '锁定图层')}
        onClick={handleToggleLock}
        disabled={!hasSelection}
        className="text-amber-500"
      />
      <MenuItem icon={Group} label={tr('contextMenu.group', '编组')} onClick={handleGroup} disabled={activeIds.length < 2} className="text-emerald-500" />
      {hasGroup && (
        <MenuItem icon={Ungroup} label={tr('contextMenu.ungroup', '解组')} onClick={handleUngroup} disabled={!hasSelection} className="text-emerald-500" />
      )}

      <Divider />

      {/* Delete */}
      <div
        className={`px-3 py-1.5 cursor-pointer flex items-center font-bold transition-colors ${!hasSelection ? 'opacity-30 pointer-events-none' : 'hover:bg-destructive/10 text-destructive'}`}
        onClick={async (event) => {
          event.stopPropagation()
          onClose()
          const nodeIds = activeIds.filter((id) => elements.some(el => el.id === id))
          const selectionCount = nodeIds.length
          if (selectionCount === 0) return
          const confirmed = await feedback.confirm({
            title: tr('contextMenu.deleteConfirm', '删除确认'),
            description: tr('contextMenu.deleteDesc', `确定要删除这 ${selectionCount} 个选中图元元素吗？`),
            confirmLabel: tr('common.delete', '删除'),
            cancelLabel: tr('common.cancel', '取消'),
            tone: 'warning',
          })
          if (!confirmed) return
          if (nodeIds.length > 0) deleteNodes(nodeIds)
          feedback.notify({
            title: tr('contextMenu.deleteSuccess', '删除成功'),
            description: tr('contextMenu.deleteSuccessDesc', `成功清除了 ${selectionCount} 个元素。`),
            tone: 'success',
          })
        }}
      >
        <Trash2 className="w-3.5 h-3.5 mr-2.5" />
        <span className="flex-1">{tr('contextMenu.delete', '删除元素')}</span>
        <span className="text-[10px] text-muted-foreground ml-4 font-mono">Del</span>
      </div>
    </div>
  )
}
