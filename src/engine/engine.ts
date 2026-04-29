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
  private listeners: Set<() => void>;

  constructor(document?: Document) {
    this.scene = createScene(document);
    this.editorState = createMockEditorState();
    this.history = new History();
    this.timeline = new Timeline();
    this.listeners = new Set();
  }

  subscribe(callback: () => void): void {
    this.listeners.add(callback);
  }

  unsubscribe(callback: () => void): void {
    this.listeners.delete(callback);
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb();
    }
  }

  getEditorState(): EditorState {
    return this.editorState;
  }

  setEditorState(updates: Partial<EditorState>): void {
    this.editorState = { ...this.editorState, ...updates };
    this.notify();
  }

  setCurrentPageId(pageId: string): void {
    this.scene.setCurrentPageId(pageId);
    this.notify();
  }

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
    this.notify();
  }

  undo(): void {
    this.history.undo();
    this.notify();
  }

  redo(): void {
    this.history.redo();
    this.notify();
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
