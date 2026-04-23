import type { Command, Document, EditorState } from '../types';
import { createMockEditorState } from '../types';
import { Scene, createScene } from './scene';
import { History } from './history';
import { Timeline } from './timeline';

export class Engine {
  readonly scene: Scene;
  readonly history: History;
  readonly timeline: Timeline;

  private editorState: EditorState;

  constructor(document?: Document) {
    this.scene = createScene(document);
    this.editorState = createMockEditorState();
    this.history = new History();
    this.timeline = new Timeline();
  }

  getEditorState(): EditorState {
    return this.editorState;
  }

  setEditorState(updates: Partial<EditorState>): void {
    this.editorState = { ...this.editorState, ...updates };
  }

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
  }

  undo(): void {
    this.history.undo();
  }

  redo(): void {
    this.history.redo();
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }
}

export function createEngine(document?: Document): Engine {
  return new Engine(document);
}
