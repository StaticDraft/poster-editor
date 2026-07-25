import { useEditorStore } from '@/store/useEditorStore'
import { buildEditorSaveFingerprint, markSaved } from '@/lib/saveStatus'

export interface ShortcutContext {
  feedback: any
  tr: (key: string, fallback: string) => string
  appRef: React.MutableRefObject<any>
  nodeMapRef: React.MutableRefObject<Map<string, any>>
  handleKeyboardDelete: (ids: string[]) => void
}

type KeyHandler = (e: KeyboardEvent, ctx: ShortcutContext) => void

const isEditingField = (activeElement: Element | null): boolean => {
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement ||
    (activeElement instanceof HTMLElement && activeElement.isContentEditable)
  )
}

const keyHandlers: KeyHandler[] = [
  // Ctrl + Z (Undo)
  (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault()
      useEditorStore.getState().undo()
    }
  },

  // Ctrl + Y or Ctrl + Shift + Z (Redo)
  (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault()
      useEditorStore.getState().redo()
    }
  },

  // Ctrl + C (Copy)
  (e, ctx) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !isEditingField(document.activeElement)) {
      e.preventDefault()
      const state = useEditorStore.getState()
      const selectedNodes = state.elements.filter((item) => state.activeIds.includes(item.id))
      if (selectedNodes.length === 0) {
        ctx.feedback.notify({
          title: ctx.tr('canvas.copyEmpty', 'Nothing to copy'),
          description: ctx.tr('canvas.copyEmptyDesc', 'Select at least one node before copying.'),
          tone: 'warning',
        })
        return
      }
      state.copy()
    }
  },

  // Ctrl + V (Paste)
  (e, ctx) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && !isEditingField(document.activeElement)) {
      e.preventDefault()
      const state = useEditorStore.getState()
      if (state.clipboard.length === 0) {
        ctx.feedback.notify({
          title: ctx.tr('canvas.pasteEmpty', 'Clipboard is empty'),
          description: ctx.tr('canvas.pasteEmptyDesc', 'Copy nodes before pasting.'),
          tone: 'warning',
        })
        return
      }
      state.paste()
    }
  },

  // Ctrl + A (Select All)
  (e, ctx) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !isEditingField(document.activeElement)) {
      e.preventDefault()
      const allElements = useEditorStore.getState().elements
      const selectableIds = allElements.filter((el) => !el.props?.isLocked).map((el) => el.id)
      useEditorStore.getState().setActiveIds(selectableIds)
      if (ctx.appRef.current && (ctx.appRef.current as any).editor) {
        const globalNodes = selectableIds.map((id) => ctx.nodeMapRef.current.get(id)).filter(Boolean)
        if (globalNodes.length > 0) (ctx.appRef.current as any).editor.target = globalNodes
      }
    }
  },

  // Arrow keys (Nudge move)
  (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isEditingField(document.activeElement)) {
      const actives = useEditorStore.getState().activeIds
      if (actives.length > 0) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        let dx = 0
        let dy = 0
        if (e.key === 'ArrowLeft') dx = -step
        if (e.key === 'ArrowRight') dx = step
        if (e.key === 'ArrowUp') dy = -step
        if (e.key === 'ArrowDown') dy = step

        const state = useEditorStore.getState()
        const updates = state.elements
          .filter((el) => actives.includes(el.id))
          .map((el) => ({
            id: el.id,
            attrs: {
              x: (el.x || 0) + dx,
              y: (el.y || 0) + dy,
            },
          }))
        state.batchUpdateNodes(updates)
      }
    }
  },

  // Ctrl + G (Group / Ungroup)
  (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !isEditingField(document.activeElement)) {
      e.preventDefault()
      const state = useEditorStore.getState()
      const actives = state.activeIds
      if (e.shiftKey) {
        state.updateNodes(actives, { groupId: undefined } as any)
      } else if (actives.length > 1) {
        const groupId = `group-${Date.now()}`
        state.updateNodes(actives, { groupId } as any)
      }
    }
  },

  // Ctrl + L (Lock / Unlock)
  (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l' && !isEditingField(document.activeElement)) {
      e.preventDefault()
      const state = useEditorStore.getState()
      const actives = state.activeIds
      if (actives.length > 0) {
        const first = state.elements.find((el) => actives.includes(el.id))
        const nextLocked = !first?.props?.isLocked
        state.updateNodes(actives, { props: { ...(first?.props || {}), isLocked: nextLocked } } as any)
      }
    }
  },

  // Ctrl + [ / ] (Z-index Layering)
  (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === ']') && !isEditingField(document.activeElement)) {
      e.preventDefault()
      const state = useEditorStore.getState()
      const actives = state.activeIds
      if (actives.length > 0) {
        const currentElements = [...state.elements]
        const targetId = actives[0]
        const idx = currentElements.findIndex((el) => el.id === targetId)
        if (idx !== -1) {
          const item = currentElements[idx]
          currentElements.splice(idx, 1)
          if (e.key === '[') {
            const newIdx = e.shiftKey ? 0 : Math.max(0, idx - 1)
            currentElements.splice(newIdx, 0, item)
          } else {
            const newIdx = e.shiftKey ? currentElements.length : Math.min(currentElements.length, idx + 1)
            currentElements.splice(newIdx, 0, item)
          }
          state.setElements(currentElements)
        }
      }
    }
  },

  // Delete / Backspace (Delete)
  (e, ctx) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditingField(document.activeElement)) {
      const actives = useEditorStore.getState().activeIds
      if (actives.length > 0) {
        e.preventDefault()
        void ctx.handleKeyboardDelete(actives)
      }
    }
  },

  // Ctrl + S (Save)
  (e, ctx) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      useEditorStore.getState().saveScene()
      const state = useEditorStore.getState()
      markSaved(buildEditorSaveFingerprint({
        currentSceneId: state.currentSceneId,
        projectName: state.projectName,
        projectCategory: state.projectCategory,
        canvasConfig: state.canvasConfig,
        elements: state.elements,
      }))
      ctx.feedback.notify({
        title: ctx.tr('canvasConfig.saved', 'Scene saved'),
        tone: 'success',
      })
    }
  },
]

export function handleGlobalKeyDown(e: KeyboardEvent, ctx: ShortcutContext) {
  for (const handler of keyHandlers) {
    handler(e, ctx)
  }
}
