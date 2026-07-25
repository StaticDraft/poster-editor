/**
 * Command Pattern interface for undo/redo support.
 */
export interface Command {
  execute(): boolean | void
  undo(): void
  readonly description: string
}
