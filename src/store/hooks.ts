import { useSyncExternalStore } from 'react';
import type { SceneStore, SceneSnapshot } from './sceneStore';
import type { SelectionStore, SelectionSnapshot } from './selectionStore';
import type { EditorUIStore, EditorUISnapshot } from './editorUIStore';
import type { HistoryStore, HistorySnapshot } from './historyStore';
import type { AnimationStore, AnimationSnapshot } from './animationStore';
import type { PluginStore, PluginSnapshot } from './pluginStore';

export function useSceneStore(store: SceneStore): SceneSnapshot {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot());
}

export function useSelectionStore(store: SelectionStore): SelectionSnapshot {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot());
}

export function useEditorUIStore(store: EditorUIStore): EditorUISnapshot {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot());
}

export function useHistoryStore(store: HistoryStore): HistorySnapshot {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot());
}

export function useAnimationStore(store: AnimationStore): AnimationSnapshot {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot());
}

export function usePluginStore(store: PluginStore): PluginSnapshot {
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot());
}
