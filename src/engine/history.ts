import type { Command } from '../types';

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  push(command: Command): void {
    this.undoStack.push(command);
    this.redoStack = [];
  }

  undo(): void {
    if (this.undoStack.length === 0) {
      return;
    }

    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
  }

  redo(): void {
    if (this.redoStack.length === 0) {
      return;
    }

    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
