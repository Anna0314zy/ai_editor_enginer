import { EngineStore } from './baseStore';
import type { Engine } from '../engine';

export interface SelectionSnapshot {
  selectedIds: string[];
  hasSelection: boolean;
  isSingleSelection: boolean;
  isMultiSelection: boolean;
  firstSelectedId: string | undefined;
}

export class SelectionStore extends EngineStore<SelectionSnapshot> {
  constructor(engine: Engine) {
    super(engine, ['editorState']);
  }

  protected buildSnapshot(): SelectionSnapshot {
    const selectedIds = this.engine.getEditorState().selectedElementIds;
    return {
      selectedIds,
      hasSelection: selectedIds.length > 0,
      isSingleSelection: selectedIds.length === 1,
      isMultiSelection: selectedIds.length > 1,
      firstSelectedId: selectedIds[0],
    };
  }

  select(id: string): void {
    this.engine.setEditorState({ selectedElementIds: [id] });
  }

  multiSelect(ids: string[]): void {
    this.engine.setEditorState({ selectedElementIds: ids });
  }

  addToSelection(id: string): void {
    const current = this.engine.getEditorState().selectedElementIds;
    if (!current.includes(id)) {
      this.engine.setEditorState({ selectedElementIds: [...current, id] });
    }
  }

  removeFromSelection(id: string): void {
    const current = this.engine.getEditorState().selectedElementIds;
    this.engine.setEditorState({
      selectedElementIds: current.filter((sid) => sid !== id),
    });
  }

  toggleSelection(id: string): void {
    const current = this.engine.getEditorState().selectedElementIds;
    if (current.includes(id)) {
      this.engine.setEditorState({
        selectedElementIds: current.filter((sid) => sid !== id),
      });
    } else {
      this.engine.setEditorState({ selectedElementIds: [...current, id] });
    }
  }

  clear(): void {
    this.engine.setEditorState({ selectedElementIds: [] });
  }

  selectAll(elementIds: string[]): void {
    this.engine.setEditorState({ selectedElementIds: [...elementIds] });
  }
}
