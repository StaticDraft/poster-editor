import type { Command } from './types'
import type { EditorNode } from '../useEditorStore'

type GetState = () => any
type SetState = (partial: any) => void

function snapshot(get: GetState) {
  const s = get()
  return { elements: [...s.elements], activeIds: [...s.activeIds] }
}

// ── Layout / Clipboard Commands ────────────────

export class PasteCommand implements Command {
  readonly description = 'Paste nodes'
  private prev: { elements: EditorNode[]; activeIds: string[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.clipboard.length === 0) return false
    this.prev = snapshot(this.get)
    const newNodes = s.clipboard.map((n: EditorNode) => ({
      ...n,
      id: `${n.type}-${Date.now()}-${Math.random()}`,
      x: n.x + 20,
      y: n.y + 20,
    }))
    this.set({
      elements: [...s.elements, ...newNodes],
      activeIds: newNodes.map((n: EditorNode) => n.id),
    })
    return true
  }
  undo() {
    if (this.prev) this.set(this.prev)
  }
}

export class BringToFrontCommand implements Command {
  readonly description = 'Bring to front'
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.activeIds.length === 0) return false
    this.prev = { elements: [...s.elements] }
    const active = s.elements.filter((n: EditorNode) => s.activeIds.includes(n.id))
    const others = s.elements.filter((n: EditorNode) => !s.activeIds.includes(n.id))
    if (active.length === 0) return false
    this.set({ elements: [...others, ...active] })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class SendToBackCommand implements Command {
  readonly description = 'Send to back'
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.activeIds.length === 0) return false
    this.prev = { elements: [...s.elements] }
    const active = s.elements.filter((n: EditorNode) => s.activeIds.includes(n.id))
    const others = s.elements.filter((n: EditorNode) => !s.activeIds.includes(n.id))
    if (active.length === 0) return false
    this.set({ elements: [...active, ...others] })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class AlignNodesCommand implements Command {
  readonly description = 'Align nodes'
  private alignType: string
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState, alignType: string) {
    this.alignType = alignType
  }
  execute() {
    const s = this.get()
    if (s.activeIds.length < 2) return false
    const nodes = s.elements.filter((el: EditorNode) => s.activeIds.includes(el.id))
    if (nodes.length < 2) return false
    this.prev = { elements: [...s.elements] }
    let updatedElements = [...s.elements]

    const minX = Math.min(...nodes.map((n: EditorNode) => n.x))
    const maxX = Math.max(...nodes.map((n: EditorNode) => n.x + (n.width || 100)))
    const minY = Math.min(...nodes.map((n: EditorNode) => n.y))
    const maxY = Math.max(...nodes.map((n: EditorNode) => n.y + (n.height || 100)))
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    nodes.forEach((n: EditorNode) => {
      const el = { ...n }
      if (this.alignType === 'left') el.x = minX
      if (this.alignType === 'right') el.x = maxX - (el.width || 100)
      if (this.alignType === 'center') el.x = centerX - (el.width || 100) / 2
      if (this.alignType === 'top') el.y = minY
      if (this.alignType === 'bottom') el.y = maxY - (el.height || 100)
      if (this.alignType === 'middle') el.y = centerY - (el.height || 100) / 2
      updatedElements = updatedElements.map((e: EditorNode) => (e.id === el.id ? el : e))
    })

    if (['distribute-x', 'distribute-y'].includes(this.alignType) && nodes.length > 2) {
      const isX = this.alignType === 'distribute-x'
      const key = isX ? 'x' : 'y'
      const sorted = [...nodes].sort((a: EditorNode, b: EditorNode) => (a as any)[key] - (b as any)[key])
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const totalSpacing = ((last as any)[key] - (first as any)[key]) / (sorted.length - 1)
      sorted.forEach((n: EditorNode, i: number) => {
        if (i === 0 || i === sorted.length - 1) return
        const el = { ...n, [key]: (first as any)[key] + totalSpacing * i }
        updatedElements = updatedElements.map((e: EditorNode) => (e.id === el.id ? el : e))
      })
    }
    this.set({ elements: updatedElements })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class ReorderNodesCommand implements Command {
  readonly description = 'Reorder layers'
  private prev: { elements: EditorNode[] } | null = null
  constructor(
    private get: GetState,
    private set: SetState,
    private newElements: EditorNode[]
  ) {}
  execute() {
    const s = this.get()
    this.prev = { elements: [...s.elements] }
    this.set({ elements: this.newElements })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class MoveForwardCommand implements Command {
  readonly description = 'Move forward one layer'
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.activeIds.length === 0) return false
    const elements = [...s.elements]
    const indices = s.activeIds
      .map((id: string) => elements.findIndex((el: EditorNode) => el.id === id))
      .filter((i: number) => i !== -1)
      .sort((a: number, b: number) => b - a) // process from back to front
    if (indices.length === 0) return false
    // If all are already at the top, nothing to do
    if (indices.every((i: number) => i >= elements.length - 1)) return false
    this.prev = { elements: [...s.elements] }
    for (const idx of indices) {
      if (idx < elements.length - 1) {
        ;[elements[idx], elements[idx + 1]] = [elements[idx + 1], elements[idx]]
      }
    }
    this.set({ elements })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class MoveBackwardCommand implements Command {
  readonly description = 'Move backward one layer'
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.activeIds.length === 0) return false
    const elements = [...s.elements]
    const indices = s.activeIds
      .map((id: string) => elements.findIndex((el: EditorNode) => el.id === id))
      .filter((i: number) => i !== -1)
      .sort((a: number, b: number) => a - b) // process from front to back
    if (indices.length === 0) return false
    // If all are already at the bottom, nothing to do
    if (indices.every((i: number) => i <= 0)) return false
    this.prev = { elements: [...s.elements] }
    for (const idx of indices) {
      if (idx > 0) {
        ;[elements[idx], elements[idx - 1]] = [elements[idx - 1], elements[idx]]
      }
    }
    this.set({ elements })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class CutCommand implements Command {
  readonly description = 'Cut nodes'
  private prev: { elements: EditorNode[]; activeIds: string[]; clipboard: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.activeIds.length === 0) return false
    const cutNodes = s.elements.filter((n: EditorNode) => s.activeIds.includes(n.id))
    if (cutNodes.length === 0) return false
    this.prev = { elements: [...s.elements], activeIds: [...s.activeIds], clipboard: [...(s.clipboard || [])] }
    this.set({
      clipboard: cutNodes,
      elements: s.elements.filter((n: EditorNode) => !s.activeIds.includes(n.id)),
      activeIds: [],
    })
    return true
  }
  undo() {
    if (this.prev) this.set(this.prev)
  }
}

