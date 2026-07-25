import type { Command } from './types'

/**
 * Manages undo/redo stacks with a configurable max history depth.
 */
export class CommandManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private readonly maxHistory: number

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory
  }

  execute(cmd: Command) {
    const didExecute = cmd.execute()
    if (didExecute === false) return false
    this.undoStack.push(cmd)
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift()
    }
    this.redoStack = []
    return true
  }

  undo(): boolean {
    const cmd = this.undoStack.pop()
    if (!cmd) return false
    cmd.undo()
    this.redoStack.push(cmd)
    return true
  }

  redo(): boolean {
    const cmd = this.redoStack.pop()
    if (!cmd) return false
    const didExecute = cmd.execute()
    if (didExecute === false) return false
    this.undoStack.push(cmd)
    return true
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
  }
}
