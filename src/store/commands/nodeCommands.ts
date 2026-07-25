import type { Command } from './types'
import type { EditorNode } from '../useEditorStore'

type GetState = () => any
type SetState = (partial: any) => void

/** Snapshot helper for undo */
function snapshot(get: GetState) {
  const s = get()
  return { elements: [...s.elements] }
}

// ── Node Commands ──────────────────────────────

export class AddNodeCommand implements Command {
  readonly description = 'Add node'
  private node: EditorNode
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState, node: EditorNode) {
    this.node = node
  }
  execute() {
    this.prev = snapshot(this.get)
    this.set({ elements: [...this.get().elements, this.node] })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class DeleteNodesCommand implements Command {
  readonly description = 'Delete nodes'
  private ids: string[]
  private prev: { elements: EditorNode[]; activeIds: string[] } | null = null
  constructor(private get: GetState, private set: SetState, ids: string[]) {
    this.ids = ids
  }
  execute() {
    const s = this.get()
    if (this.ids.length === 0) return false
    this.prev = { elements: [...s.elements], activeIds: [...s.activeIds] }
    const newElements = s.elements.filter((el: EditorNode) => !this.ids.includes(el.id))
    if (newElements.length === s.elements.length) return false
    this.set({
      elements: newElements,
      activeIds: s.activeIds.filter((id: string) => !this.ids.includes(id)),
    })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements, activeIds: this.prev.activeIds })
  }
}

export class UpdateNodeCommand implements Command {
  readonly description = 'Update node'
  private id: string
  private attrs: Partial<EditorNode>
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState, id: string, attrs: Partial<EditorNode>) {
    this.id = id
    this.attrs = attrs
  }
  execute() {
    this.prev = snapshot(this.get)
    if (!this.get().elements.some((el: EditorNode) => el.id === this.id)) return false
    this.set({
      elements: this.get().elements.map((el: EditorNode) =>
        el.id === this.id ? { ...el, ...this.attrs } : el
      ),
    })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class UpdateNodesCommand implements Command {
  readonly description = 'Update multiple nodes'
  private ids: string[]
  private attrs: Partial<EditorNode>
  private prev: { elements: EditorNode[] } | null = null
  constructor(private get: GetState, private set: SetState, ids: string[], attrs: Partial<EditorNode>) {
    this.ids = ids
    this.attrs = attrs
  }
  execute() {
    this.prev = snapshot(this.get)
    if (this.ids.length === 0) return false
    if (!this.get().elements.some((el: EditorNode) => this.ids.includes(el.id))) return false
    this.set({
      elements: this.get().elements.map((el: EditorNode) =>
        this.ids.includes(el.id) ? { ...el, ...this.attrs } : el
      ),
    })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class BatchUpdateNodesCommand implements Command {
  readonly description = 'Batch update nodes geometry'
  private updates: Array<{ id: string; attrs: Partial<EditorNode> }>
  private prev: { elements: EditorNode[] } | null = null
  constructor(
    private get: GetState,
    private set: SetState,
    updates: Array<{ id: string; attrs: Partial<EditorNode> }>
  ) {
    this.updates = updates
  }
  execute() {
    this.prev = snapshot(this.get)
    if (this.updates.length === 0) return false
    const updateMap = new Map(this.updates.map(u => [u.id, u.attrs]))
    this.set({
      elements: this.get().elements.map((el: EditorNode) => {
        const attrs = updateMap.get(el.id)
        return attrs ? { ...el, ...attrs } : el
      }),
    })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements })
  }
}

export class ClearNodesCommand implements Command {
  readonly description = 'Clear all nodes'
  private prev: { elements: EditorNode[]; activeIds: string[] } | null = null
  constructor(private get: GetState, private set: SetState) {}
  execute() {
    const s = this.get()
    if (s.elements.length === 0) return false
    this.prev = { elements: [...s.elements], activeIds: [...s.activeIds] }
    this.set({ elements: [], activeIds: [] })
    return true
  }
  undo() {
    if (this.prev) this.set({ elements: this.prev.elements, activeIds: this.prev.activeIds })
  }
}
