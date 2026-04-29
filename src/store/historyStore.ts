import { EngineStore } from './baseStore';
import type { Engine } from '../engine';

export interface HistorySnapshot {
  canUndo: boolean;
  canRedo: boolean;
}

export class HistoryStore extends EngineStore<HistorySnapshot> {
  constructor(engine: Engine) {
    super(engine, ['history']);
  }

  protected buildSnapshot(): HistorySnapshot {
    return {
      canUndo: this.engine.canUndo(),
      canRedo: this.engine.canRedo(),
    };
  }

  undo(): void {
    this.engine.undo();
  }

  redo(): void {
    this.engine.redo();
  }

  clear(): void {
    this.engine.history.clear();
    // Manually emit since History.clear() does not notify Engine listeners
    this.emit();
  }
}
