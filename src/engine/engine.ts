import type { Command, Document, EditorState, PageBackground, SafeArea } from '../types';
import { createMockEditorState } from '../types';
import { Scene, createScene } from './scene';
import { History } from './history';
import { Timeline } from './timeline';
import { PluginRegistry } from './pluginRegistry';
import type { EnginePlugin } from './pluginRegistry';

export type EngineTopic = 'scene' | 'editorState' | 'history' | 'all';

// Reserved types for future selector-based precise subscriptions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SelectorFn<T> = (engine: Engine) => T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComparatorFn<T> = (a: T, b: T) => boolean;

export class Engine {
  readonly scene: Scene;
  readonly history: History;
  readonly timeline: Timeline;
  readonly pluginRegistry: PluginRegistry;

  private editorState: EditorState;
  private listeners: Set<() => void>;
  private topicListeners: Map<EngineTopic, Set<() => void>>;

  constructor(document?: Document) {
    this.scene = createScene(document);
    this.editorState = createMockEditorState();
    this.history = new History();
    this.timeline = new Timeline();
    this.pluginRegistry = new PluginRegistry();
    this.listeners = new Set();
    this.topicListeners = new Map();
  }

  subscribe(callback: () => void): void;
  subscribe(topic: EngineTopic, callback: () => void): void;
  subscribe(topicOrCallback: EngineTopic | (() => void), callback?: () => void): void {
    if (typeof topicOrCallback === 'function') {
      this.listeners.add(topicOrCallback);
    } else {
      const topic = topicOrCallback;
      const cb = callback!;
      let set = this.topicListeners.get(topic);
      if (!set) {
        set = new Set();
        this.topicListeners.set(topic, set);
      }
      set.add(cb);
    }
  }

  unsubscribe(callback: () => void): void;
  unsubscribe(topic: EngineTopic, callback: () => void): void;
  unsubscribe(topicOrCallback: EngineTopic | (() => void), callback?: () => void): void {
    if (typeof topicOrCallback === 'function') {
      this.listeners.delete(topicOrCallback);
    } else {
      const topic = topicOrCallback;
      const cb = callback!;
      this.topicListeners.get(topic)?.delete(cb);
    }
  }

  private notify(topic: EngineTopic): void {
    for (const cb of this.listeners) {
      cb();
    }
    const topicSet = this.topicListeners.get(topic);
    if (topicSet) {
      for (const cb of topicSet) {
        cb();
      }
    }
  }

  getEditorState(): EditorState {
    return this.editorState;
  }

  setEditorState(updates: Partial<EditorState>): void {
    this.editorState = { ...this.editorState, ...updates };
    this.notify('editorState');
  }

  setCurrentPageId(pageId: string): void {
    this.scene.setCurrentPageId(pageId);
    this.notify('scene');
  }

  updateDocumentBackground(background: PageBackground): void {
    this.scene.updateDocumentBackground(background);
    this.notify('scene');
  }

  updateDocumentSafeArea(safeArea: SafeArea): void {
    this.scene.updateDocumentSafeArea(safeArea);
    this.notify('scene');
  }

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
    this.notify('scene');
    this.notify('history');
  }

  undo(): void {
    this.history.undo();
    this.notify('scene');
    this.notify('history');
  }

  redo(): void {
    this.history.redo();
    this.notify('scene');
    this.notify('history');
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  use(plugin: EnginePlugin): void {
    this.pluginRegistry.register(plugin);
    if (plugin.onRegister) {
      plugin.onRegister(this);
    }
  }

  unuse(pluginId: string): void {
    const plugin = this.pluginRegistry.getPlugin(pluginId);
    if (plugin?.onUnregister) {
      plugin.onUnregister(this);
    }
    this.pluginRegistry.unregister(pluginId);
  }

  // Reserved extension point for future selector-based precise subscriptions.
  // subscribeSelector<T>(
  //   selector: SelectorFn<T>,
  //   comparator: ComparatorFn<T>,
  //   callback: () => void
  // ): void {
  //   // TODO: implement selector-based subscription
  // }
}

export function createEngine(document?: Document): Engine {
  return new Engine(document);
}
