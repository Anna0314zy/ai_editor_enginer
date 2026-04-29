import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Engine } from '../engine';
import { SceneStore } from './sceneStore';
import { SelectionStore } from './selectionStore';
import { EditorUIStore } from './editorUIStore';
import { HistoryStore } from './historyStore';
import { AnimationStore } from './animationStore';
import { PluginStore } from './pluginStore';

export interface StoreContextValue {
  sceneStore: SceneStore;
  selectionStore: SelectionStore;
  editorUIStore: EditorUIStore;
  historyStore: HistoryStore;
  animationStore: AnimationStore;
  pluginStore: PluginStore;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export interface StoreProviderProps {
  engine: Engine;
  children: ReactNode;
}

export function StoreProvider({ engine, children }: StoreProviderProps) {
  const stores = useMemo<StoreContextValue>(
    () => ({
      sceneStore: new SceneStore(engine),
      selectionStore: new SelectionStore(engine),
      editorUIStore: new EditorUIStore(engine),
      historyStore: new HistoryStore(engine),
      animationStore: new AnimationStore(engine),
      pluginStore: new PluginStore(),
    }),
    [engine]
  );

  return <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>;
}

export function useStores(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return ctx;
}
