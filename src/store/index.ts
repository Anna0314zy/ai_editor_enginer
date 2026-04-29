// Store - reactive views over Engine state

export { BaseStore, EngineStore } from './baseStore';
export type { BaseStore as BaseStoreType, EngineStore as EngineStoreType } from './baseStore';

export { SceneStore } from './sceneStore';
export type { SceneSnapshot } from './sceneStore';

export { SelectionStore } from './selectionStore';
export type { SelectionSnapshot } from './selectionStore';

export { EditorUIStore } from './editorUIStore';
export type { EditorUISnapshot } from './editorUIStore';

export { HistoryStore } from './historyStore';
export type { HistorySnapshot } from './historyStore';

export { AnimationStore } from './animationStore';
export type { AnimationSnapshot } from './animationStore';

export { PluginStore } from './pluginStore';
export type { PluginSnapshot, Plugin, PluginLifecycle } from './pluginStore';

export {
  useSceneStore,
  useSelectionStore,
  useEditorUIStore,
  useHistoryStore,
  useAnimationStore,
  usePluginStore,
} from './hooks';

export { StoreProvider, useStores } from './StoreProvider';
export type { StoreContextValue, StoreProviderProps } from './StoreProvider';
