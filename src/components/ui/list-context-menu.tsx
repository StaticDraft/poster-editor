import { useEffect, type ComponentType } from 'react'

export interface ListContextMenuAction {
  label: string
  icon: ComponentType<{ className?: string }>
  onClick: () => void
  tone?: 'default' | 'danger' | 'accent'
}

interface ListContextMenuProps {
  pos: { x: number; y: number }
  actions: ListContextMenuAction[]
  onClose: () => void
}

export function ListContextMenu({ pos, actions, onClose }: ListContextMenuProps) {
  useEffect(() => {
    const handlePointerDown = () => onClose()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const left = Math.max(8, Math.min(pos.x, window.innerWidth - 196))
  const top = Math.max(8, Math.min(pos.y, window.innerHeight - Math.max(120, actions.length * 40 + 16)))

  return (
    <div
      className="fixed z-[700] min-w-[188px] rounded-md border border-border bg-card py-1.5 text-xs text-foreground shadow-2xl"
      style={{ left, top }}
      onMouseDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {actions.map(({ label, icon: Icon, onClick, tone = 'default' }) => (
        <button
          key={label}
          type="button"
          className={`flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors ${
            tone === 'danger'
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : tone === 'accent'
                ? 'text-purple-400 hover:bg-purple-500/10 hover:text-purple-300'
                : 'text-foreground hover:bg-muted'
          }`}
          onClick={() => {
            onClick()
            onClose()
          }}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
