import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditorStore } from '@/store/useEditorStore'
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Square,
  Circle,
  Type,
  Star,
  Image,
  Minus,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  GripVertical,
} from 'lucide-react'
import { useFeedback } from '@/lib/feedback'
import { MiniMap } from '@/core/leafer/MiniMap'

function getNodeIcon(type: string) {
  if (type === 'Ellipse') return <Circle className="w-3 h-3 text-rose-400 shrink-0" />
  if (type === 'Text') return <Type className="w-3 h-3 text-blue-400 shrink-0" />
  if (type === 'Star') return <Star className="w-3 h-3 text-amber-400 shrink-0" />
  if (type === 'Image') return <Image className="w-3 h-3 text-emerald-400 shrink-0" />
  if (type === 'Rect') return <Square className="w-3 h-3 text-[darkgrey] shrink-0" />
  return <Minus className="w-3 h-3 text-editor-text-dim shrink-0" />
}

type DropPosition = 'before' | 'after' | null

function NodeRow({
  el,
  depth = 0,
  onSelect,
  onDelete,
  draggedId,
  onDragStart,
  dropTarget,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  el: any
  depth?: number
  onSelect: (ids: string[], e: React.MouseEvent, anchorId?: string) => void
  onDelete: (ids: string[], label: string) => void
  draggedId: string | null
  onDragStart: (id: string) => void
  dropTarget: { id: string; position: DropPosition } | null
  onDragEnter: (id: string, position: DropPosition) => void
  onDragLeave: () => void
  onDrop: (targetId: string, position: DropPosition) => void
}) {
  const { t } = useTranslation()
  const activeIds = useEditorStore(s => s.activeIds)
  const updateNode = useEditorStore(s => s.updateNode)
  const rowRef = useRef<HTMLDivElement>(null)

  const isActive = activeIds.includes(el.id)
  const isDragging = draggedId === el.id
  const isDropBefore = dropTarget?.id === el.id && dropTarget?.position === 'before'
  const isDropAfter = dropTarget?.id === el.id && dropTarget?.position === 'after'

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', el.id)
    e.dataTransfer.effectAllowed = 'move'
    // Set a custom drag image with slight offset
    if (rowRef.current) {
      e.dataTransfer.setDragImage(rowRef.current, 10, 10)
    }
    onDragStart(el.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId === el.id) return

    // Determine drop position based on mouse Y relative to row
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position: DropPosition = e.clientY < midY ? 'before' : 'after'
    onDragEnter(el.id, position)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only handle if leaving the row entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (
      e.clientX < rect.left || e.clientX > rect.right ||
      e.clientY < rect.top || e.clientY > rect.bottom
    ) {
      onDragLeave()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position: DropPosition = e.clientY < midY ? 'before' : 'after'
    onDrop(el.id, position)
  }

  return (
    <div className="relative">
      {/* Drop indicator line - before */}
      {isDropBefore && (
        <div className="absolute top-0 left-2 right-2 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]">
          <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}

      <div
        ref={rowRef}
        onClick={(e) => onSelect([el.id], e, el.id)}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group flex items-center gap-1 py-1.5 cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'opacity-40 scale-[0.98]'
            : isActive
              ? 'bg-blue-600/20 border-l-2 border-blue-500'
              : 'hover:bg-editor-surface border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${6 + depth * 14}px` }}
      >
        {/* Drag handle */}
        <GripVertical className="w-3 h-3 text-editor-text-dim opacity-0 group-hover:opacity-60 shrink-0 cursor-grab active:cursor-grabbing" />
        {getNodeIcon(el.type)}
        <span className={`text-[11px] flex-1 truncate ${isActive ? 'text-white' : 'text-editor-text'}`}>
          {el.type === 'Text' ? (el.text?.slice(0, 14) || tr('layer.text', '文字')) : el.type}
        </span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
          <button onClick={e => { e.stopPropagation(); updateNode(el.id, { hidden: !el.hidden } as any) }}
            className="p-0.5 rounded hover:text-white">
            {el.hidden ? <EyeOff className="w-3 h-3 text-editor-text-dim" /> : <Eye className="w-3 h-3 text-editor-text-label" />}
          </button>
          <button onClick={e => { e.stopPropagation(); updateNode(el.id, { locked: !el.locked } as any) }}
            className="p-0.5 rounded hover:text-white">
            {el.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-editor-text-label" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete([el.id], el.type === 'Text' ? el.text || el.id : el.id)
            }}
            className="p-0.5 rounded hover:text-red-400">
            <Trash2 className="w-3 h-3 text-editor-text-dim" />
          </button>
        </div>
      </div>

      {/* Drop indicator line - after */}
      {isDropAfter && (
        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]">
          <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  )
}

function computeReorderedElements({
  draggedId,
  targetId,
  position,
  elements,
}: {
  draggedId: string
  targetId: string
  position: DropPosition
  elements: any[]
}): any[] | null {
  const isDraggingGroup = draggedId.startsWith('group:')
  const draggedGid = isDraggingGroup ? draggedId.replace('group:', '') : null
  const draggedNodeIds = isDraggingGroup
    ? elements.filter(e => e.groupId === draggedGid).map(e => e.id)
    : [draggedId]

  if (draggedNodeIds.length === 0) return null

  const isTargetGroup = targetId.startsWith('group:')
  const targetGid = isTargetGroup ? targetId.replace('group:', '') : null

  let targetNodeId: string | null = null
  let nextGroupId: string | undefined = undefined

  if (isTargetGroup && targetGid) {
    const targetGroupMembers = elements.filter(e => e.groupId === targetGid)
    if (targetGroupMembers.length === 0) return null

    if (position === null) {
      if (isDraggingGroup) return null
      const topMember = [...targetGroupMembers].reverse()[0]
      targetNodeId = topMember.id
      nextGroupId = targetGid
      position = 'before'
    } else if (position === 'before') {
      const topMember = [...targetGroupMembers].reverse()[0]
      targetNodeId = topMember.id
      nextGroupId = isDraggingGroup ? draggedGid! : undefined
    } else {
      const bottomMember = targetGroupMembers[0]
      targetNodeId = bottomMember.id
      nextGroupId = isDraggingGroup ? draggedGid! : undefined
    }
  } else {
    const targetNode = elements.find(e => e.id === targetId)
    if (!targetNode) return null
    targetNodeId = targetNode.id

    if (isDraggingGroup) {
      nextGroupId = draggedGid!
    } else {
      nextGroupId = targetNode.groupId
    }
  }

  if (!targetNodeId) return null
  if (draggedNodeIds.includes(targetNodeId)) return null

  const updatedElements = elements.map(el => {
    if (draggedNodeIds.includes(el.id)) {
      return { ...el, groupId: nextGroupId }
    }
    return el
  })

  const draggedEls = updatedElements.filter(e => draggedNodeIds.includes(e.id))
  const remainingEls = updatedElements.filter(e => !draggedNodeIds.includes(e.id))

  const targetIndex = remainingEls.findIndex(e => e.id === targetNodeId)
  if (targetIndex === -1) return null

  const insertIndex = position === 'before' ? targetIndex + 1 : targetIndex

  remainingEls.splice(insertIndex, 0, ...draggedEls)
  return remainingEls
}

export function LayerTree() {
  const { t } = useTranslation()
  const feedback = useFeedback()
  const elements = useEditorStore(s => s.elements)
  const activeIds = useEditorStore(s => s.activeIds)
  const setActiveIds = useEditorStore(s => s.setActiveIds)
  const deleteNodes = useEditorStore(s => s.deleteNodes)
  const updateNodes = useEditorStore(s => s.updateNodes)

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null)

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string; position: DropPosition } | null>(null)

  const toggleGroup = (gid: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(gid) ? next.delete(gid) : next.add(gid)
      return next
    })
  }

  // Build tree items in interleaved z-index order (groups and single nodes in reverse order)
  const reversed = useMemo(() => [...elements].reverse(), [elements])

  const treeItems = useMemo(() => {
    const items: Array<
      | { type: 'group'; gid: string; members: any[] }
      | { type: 'node'; el: any }
    > = []

    const visitedGroups = new Set<string>()

    reversed.forEach(el => {
      if (el.groupId) {
        if (!visitedGroups.has(el.groupId)) {
          visitedGroups.add(el.groupId)
          const members = reversed.filter(m => m.groupId === el.groupId)
          items.push({ type: 'group', gid: el.groupId, members })
        }
      } else {
        items.push({ type: 'node', el })
      }
    })

    return items
  }, [reversed])

  const selectionOrder = useMemo(
    () => reversed.map((el) => el.id),
    [reversed],
  )

  const tr = (key: string, fallback: string) => {
    const value = t(key)
    return value === key ? fallback : value
  }

  const handleSelect = (ids: string[], e: React.MouseEvent, anchorId = ids[0]) => {
    if (e.shiftKey && selectionAnchorId) {
      const start = selectionOrder.indexOf(selectionAnchorId)
      const end = selectionOrder.indexOf(anchorId)
      if (start !== -1 && end !== -1) {
        const [from, to] = start < end ? [start, end] : [end, start]
        setActiveIds(selectionOrder.slice(from, to + 1))
        return
      }
    }

    if (e.metaKey || e.ctrlKey) {
      const next = new Set(activeIds)
      const allSelected = ids.every((id) => next.has(id))
      ids.forEach((id) => {
        if (allSelected) next.delete(id)
        else next.add(id)
      })
      setActiveIds(Array.from(next))
      setSelectionAnchorId(anchorId)
      return
    }

    setActiveIds(ids)
    setSelectionAnchorId(anchorId)
  }

  const confirmLayerDeletion = (label: string) =>
    feedback.confirm({
      title: tr('layer.deleteConfirm', '确认删除图层'),
      description: label,
      confirmLabel: tr('common.delete', '删除'),
      cancelLabel: tr('common.cancel', '取消'),
      tone: 'warning',
    })

  const notifyLayerDeletion = (label: string) =>
    feedback.notify({
      title: tr('layer.deleteSuccess', '该图层已删除'),
      description: label,
      tone: 'success',
    })

  const handleDelete = async (ids: string[], label: string) => {
    const confirmed = await confirmLayerDeletion(label)
    if (!confirmed) return
    deleteNodes(ids)
    notifyLayerDeletion(label)
  }

  // ── Drag & Drop handlers ──
  const handleDragStart = useCallback((id: string) => {
    setDraggedId(id)
  }, [])

  const handleDragEnter = useCallback((id: string, position: DropPosition) => {
    setDropTarget({ id, position })
  }, [])

  const handleDragLeave = useCallback(() => {
    // Debounce if needed
  }, [])

  const handleDrop = useCallback((targetId: string, position: DropPosition) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      setDropTarget(null)
      return
    }

    const store = useEditorStore.getState()
    const newElements = computeReorderedElements({
      draggedId,
      targetId,
      position,
      elements: store.elements,
    })

    if (newElements) {
      store.reorderElements(newElements)
    }

    setDraggedId(null)
    setDropTarget(null)
  }, [draggedId])

  // Handle group header drag start (drag entire group)
  const handleGroupDragStart = useCallback((gid: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', `group:${gid}`)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(`group:${gid}`)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDropTarget(null)
  }, [])

  // Shared drag props for NodeRow
  const dragProps = {
    draggedId,
    onDragStart: handleDragStart,
    dropTarget,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" onDragEnd={handleDragEnd}>
      <div className="px-3 py-2 text-[10px] font-bold text-editor-text-dim uppercase tracking-widest border-b border-editor-darker shrink-0">
        {tr('layer.title', '图层树')} ({elements.length} {tr('layer.elements', '个元素')})
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {elements.length === 0 && (
          <div className="text-center text-editor-text-dim text-xs py-10">{tr('layer.emptyCanvas', '空白画布')}</div>
        )}

        {/* Render tree items in interleaved z-index order */}
        {treeItems.map(item => {
          if (item.type === 'node') {
            return (
              <NodeRow
                key={item.el.id}
                el={item.el}
                depth={0}
                onSelect={handleSelect}
                onDelete={handleDelete}
                {...dragProps}
              />
            )
          }

          const { gid, members: groupMembers } = item
          const isCollapsed = collapsedGroups.has(gid)
          const allActive = groupMembers.every(el => activeIds.includes(el.id))
          const isGroupDropTarget = dropTarget?.id === `group:${gid}`

          return (
            <div key={gid} className="relative">
              {/* Drop indicator - before group */}
              {dropTarget?.id === `group:${gid}` && dropTarget?.position === 'before' && (
                <div className="absolute top-0 left-2 right-2 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]">
                  <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}
              <div
                onClick={(e) => handleSelect(groupMembers.map(el => el.id), e, groupMembers[0]?.id)}
                onDoubleClick={() => toggleGroup(gid)}
                draggable
                onDragStart={(e) => handleGroupDragStart(gid, e)}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.dataTransfer.dropEffect = 'move'
                  if (draggedId && draggedId !== `group:${gid}`) {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    const relY = e.clientY - rect.top
                    const height = rect.height
                    if (relY < height * 0.25) {
                      setDropTarget({ id: `group:${gid}`, position: 'before' })
                    } else if (relY > height * 0.75) {
                      setDropTarget({ id: `group:${gid}`, position: 'after' })
                    } else {
                      // Middle zone = drop INTO the group
                      setDropTarget({ id: `group:${gid}`, position: null })
                    }
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!draggedId) return
                  const position = dropTarget?.id === `group:${gid}` ? dropTarget.position : null
                  handleDrop(`group:${gid}`, position)
                }}
                className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-all ${
                  isGroupDropTarget && dropTarget?.position === null
                    ? 'bg-amber-500/20 border-l-2 border-amber-400 ring-1 ring-amber-400/30'
                    : allActive
                      ? 'bg-blue-600/20 border-l-2 border-blue-500'
                      : 'hover:bg-editor-surface border-l-2 border-transparent'
                }`}
              >
                <GripVertical className="w-3 h-3 text-editor-text-dim opacity-0 group-hover:opacity-60 shrink-0 cursor-grab active:cursor-grabbing" />
                <button onClick={e => { e.stopPropagation(); toggleGroup(gid) }} className="p-0.5">
                  {isCollapsed ? <ChevronRight className="w-3 h-3 text-editor-text-label" /> : <ChevronDown className="w-3 h-3 text-editor-text-label" />}
                </button>
                {isCollapsed
                  ? <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  : <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span className="text-[11px] text-amber-300 font-bold flex-1 truncate">
                  {tr('layer.group', '图元组合')} <span className="text-editor-text-dim font-normal">({groupMembers.length})</span>
                </span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                  <button onClick={e => { e.stopPropagation(); updateNodes(groupMembers.map(el => el.id), { groupId: undefined }) }}
                    className="text-[10px] text-editor-text-label hover:text-white px-1 rounded">{tr('layer.ungroup', '解除组合')}</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(groupMembers.map(el => el.id), `${groupMembers.length} ${tr('layer.elements', '个元素')}`) }}
                    className="p-0.5 rounded hover:text-red-400">
                    <Trash2 className="w-3 h-3 text-editor-text-dim" />
                  </button>
                </div>
              </div>
              {/* Drop indicator - after group */}
              {dropTarget?.id === `group:${gid}` && dropTarget?.position === 'after' && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 z-10 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]">
                  <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-blue-500" />
                </div>
              )}
              {!isCollapsed && groupMembers.map(el => (
                <NodeRow key={el.id} el={el} depth={1} onSelect={handleSelect} onDelete={handleDelete} {...dragProps} />
              ))}
            </div>
          )
        })}
      </div>

      {/* MiniMap anchored at bottom */}
      <div className="p-3 border-t border-editor-darker shrink-0 bg-editor-deep/40">
        <MiniMap />
      </div>
    </div>
  )
}
