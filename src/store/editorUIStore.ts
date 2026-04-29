import { EngineStore } from './baseStore';
import type { Engine } from '../engine';
import type { Viewport, ToolMode } from '../types';

export interface EditorUISnapshot {
  viewport: Viewport;
  toolMode: ToolMode;
  hoveredElementId: string | null;
}

export class EditorUIStore extends EngineStore<EditorUISnapshot> {
  constructor(engine: Engine) {
    super(engine, ['editorState']);
  }

  protected buildSnapshot(): EditorUISnapshot {
    const state = this.engine.getEditorState();
    return {
      viewport: state.viewport,
      toolMode: state.toolMode,
      hoveredElementId: state.hoveredElementId,
    };
  }

  setViewport(updates: Partial<Viewport>): void {
    this.engine.setEditorState({
      viewport: { ...this.engine.getEditorState().viewport, ...updates },
    });
  }

  setToolMode(mode: ToolMode): void {
    this.engine.setEditorState({ toolMode: mode });
  }

  setHoveredElementId(id: string | null): void {
    this.engine.setEditorState({ hoveredElementId: id });
  }

  zoomIn(step = 0.1): void {
    const { zoom } = this.engine.getEditorState().viewport;
    this.setViewport({ zoom: Math.min(zoom + step, 3) });
  }

  zoomOut(step = 0.1): void {
    const { zoom } = this.engine.getEditorState().viewport;
    this.setViewport({ zoom: Math.max(zoom - step, 0.2) });
  }

  resetZoom(): void {
    this.setViewport({ zoom: 1 });
  }
}
