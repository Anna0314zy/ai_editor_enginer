import { useState, useEffect, useCallback, useRef } from 'react';
import type { Engine } from './engine';
import { DeleteElementCommand } from './engine';
import type { AnimationEngine } from './animation';
import { AnimationScheduler } from './animation';
import { useStores, useSceneStore, useSelectionStore, useHistoryStore, useAnimationStore } from './store';
import StructurePanel from './components/StructurePanel';
import CanvasToolbar from './components/CanvasToolbar';
import Canvas from './components/Canvas';
import PropertyPanel from './components/PropertyPanel';
import GlobalSettingsPanel from './components/GlobalSettingsPanel';
import AnimationPanel from './components/AnimationPanel';
import PreviewModal from './components/PreviewModal';

interface AppProps {
  engine: Engine;
  animationEngine: AnimationEngine;
}

function App({ engine, animationEngine }: AppProps) {
  const { sceneStore, selectionStore, historyStore, animationStore } = useStores();
  const sceneSnapshot = useSceneStore(sceneStore);
  const selectionSnapshot = useSelectionStore(selectionStore);
  const historySnapshot = useHistoryStore(historyStore);
  const animSnapshot = useAnimationStore(animationStore);
  const pluginPanels = engine.pluginRegistry.getPanels();
  const allTabs = [
    { id: 'properties', label: 'Properties' },
    { id: 'global', label: 'Global' },
    { id: 'animation', label: 'Animation' },
    ...pluginPanels.map((p) => ({ id: p.id, label: p.label })),
  ];
  const [rightPanelTab, setRightPanelTab] = useState<string>(allTabs[0]?.id ?? 'properties');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [stepScheduler, setStepScheduler] = useState<AnimationScheduler | null>(null);
  const [stepProgress, setStepProgress] = useState({ current: 0, total: 0 });
  const schedulerRef = useRef<AnimationScheduler | null>(null);

  // Sync scene animations to animationEngine
  useEffect(() => {
    animationEngine.reset();
    for (const anim of animSnapshot.currentPageAnimations) {
      if (anim.enable) animationEngine.register(anim);
    }
  }, [sceneSnapshot.currentPageId, animSnapshot.currentPageAnimations, animationEngine]);

  // Auto-manage step scheduler: create when on animation tab, destroy when leaving
  useEffect(() => {
    if (rightPanelTab === 'animation' && !isPreviewOpen) {
      const pageId = engine.scene.getDocument().currentPageId;
      const anims = engine.scene.getPageAnimations(pageId);
      // Re-sync animationEngine configs to the current edit page
      animationEngine.reset();
      for (const anim of anims) {
        if (anim.enable) animationEngine.register(anim);
      }
      const enabledAnims = anims.filter((a) => a.enable);
      const scheduler = new AnimationScheduler(animationEngine);
      scheduler.load(enabledAnims);
      schedulerRef.current = scheduler;
      setStepScheduler(scheduler);
      setStepProgress({ current: 0, total: scheduler.getStepCount() });
    } else {
      if (schedulerRef.current) {
        schedulerRef.current.reset();
        schedulerRef.current = null;
      }
      setStepScheduler(null);
      setStepProgress({ current: 0, total: 0 });
      animationEngine.stopAll();
    }
  }, [rightPanelTab, isPreviewOpen, engine, animationEngine]);

  // Reload scheduler when animations change while on animation tab
  useEffect(() => {
    if (rightPanelTab === 'animation' && !isPreviewOpen && schedulerRef.current) {
      const anims = animSnapshot.currentPageAnimations.filter((a) => a.enable);
      schedulerRef.current.reset();
      schedulerRef.current.load(anims);
      setStepProgress({ current: 0, total: schedulerRef.current.getStepCount() });
    }
  }, [animSnapshot.currentPageAnimations, rightPanelTab, isPreviewOpen]);

  const handleReset = useCallback(() => {
    animationEngine.stopAll();
    if (schedulerRef.current) {
      schedulerRef.current.reset();
      const pageId = engine.scene.getDocument().currentPageId;
      const anims = engine.scene.getPageAnimations(pageId).filter((a) => a.enable);
      schedulerRef.current.load(anims);
      setStepProgress({ current: 0, total: schedulerRef.current.getStepCount() });
    }
  }, [animationEngine, engine]);

  const handleNextStep = useCallback(() => {
    if (schedulerRef.current) {
      schedulerRef.current.playNextStep();
      setStepProgress({
        current: schedulerRef.current.getCurrentStepIndex() + 1,
        total: schedulerRef.current.getStepCount(),
      });
    }
  }, []);

  const handlePreviousStep = useCallback(() => {
    if (schedulerRef.current) {
      schedulerRef.current.playPreviousStep();
      setStepProgress({
        current: schedulerRef.current.getCurrentStepIndex() + 1,
        total: schedulerRef.current.getStepCount(),
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMeta = e.ctrlKey || e.metaKey;

      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historySnapshot.canUndo) {
          historyStore.undo();
        }
      }

      if ((isMeta && e.key === 'y') || (isMeta && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        if (historySnapshot.canRedo) {
          historyStore.redo();
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        const isEditing =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable;

        if (!isEditing) {
          if (selectionSnapshot.selectedIds.length > 0) {
            e.preventDefault();
            engine.execute(new DeleteElementCommand(engine.scene, selectionSnapshot.selectedIds[0], sceneSnapshot.currentPageId));
            selectionStore.clear();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine, historySnapshot, historyStore, selectionSnapshot, selectionStore, sceneSnapshot.currentPageId]);

  const elementCount = sceneSnapshot.currentPageElements.length;

  return (
    <div className="w-screen h-screen flex flex-col">
      <header className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <h1 className="m-0 text-lg text-gray-900">Slides Editor</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (historySnapshot.canUndo) {
                historyStore.undo();
              }
            }}
            disabled={!historySnapshot.canUndo}
            className={`px-3 py-1.5 text-xs border border-gray-300 rounded ${
              historySnapshot.canUndo
                ? 'bg-white text-gray-700 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Undo
          </button>
          <button
            onClick={() => {
              if (historySnapshot.canRedo) {
                historyStore.redo();
              }
            }}
            disabled={!historySnapshot.canRedo}
            className={`px-3 py-1.5 text-xs border border-gray-300 rounded ${
              historySnapshot.canRedo
                ? 'bg-white text-gray-700 cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Redo
          </button>
          {rightPanelTab === 'animation' && (
            <>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded bg-white text-gray-700 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={handlePreviousStep}
                disabled={!stepScheduler?.canGoBack()}
                className={`px-3 py-1.5 text-xs border border-gray-300 rounded text-white ${
                  !stepScheduler?.canGoBack()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 cursor-pointer'
                }`}
              >
                Previous Step
              </button>
              <button
                onClick={handleNextStep}
                disabled={!stepScheduler?.canAdvance()}
                className={`px-3 py-1.5 text-xs border border-gray-300 rounded text-white ${
                  !stepScheduler?.canAdvance()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 cursor-pointer'
                }`}
              >
                Next Step ({stepProgress.current}/{stepProgress.total})
              </button>
            </>
          )}
          <button
            onClick={() => {
              selectionStore.clear();
              setIsPreviewOpen(true);
            }}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded bg-emerald-500 text-white cursor-pointer ml-2"
          >
            Full Preview
          </button>
          <div className="text-xs text-gray-500 ml-2">
            {elementCount} elements
          </div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <StructurePanel engine={engine} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <CanvasToolbar engine={engine} />
          <div className="flex-1 overflow-hidden">
            <Canvas engine={engine} animationEngine={animationEngine} />
          </div>
        </div>
        <div className="flex flex-col w-[400px] border-l border-gray-200 shrink-0">
          <div className="flex border-b border-gray-200 bg-white">
            {allTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightPanelTab(tab.id)}
                className={`flex-1 py-2.5 text-xs border-none bg-transparent cursor-pointer ${
                  rightPanelTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
                    : 'border-b-2 border-transparent text-gray-500 font-normal'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {rightPanelTab === 'properties' && <PropertyPanel engine={engine} />}
          {rightPanelTab === 'global' && <GlobalSettingsPanel engine={engine} />}
          {rightPanelTab === 'animation' && <AnimationPanel engine={engine} animationEngine={animationEngine} />}
          {pluginPanels.map(
            (panel) =>
              rightPanelTab === panel.id && (
                <panel.component key={panel.id} engine={engine} animationEngine={animationEngine} />
              )
          )}
        </div>
      </main>

      {isPreviewOpen && (
        <PreviewModal
          animationEngine={animationEngine}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
