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
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'animation'>('properties');
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

  const currentPageId = sceneSnapshot.currentPageId;
  const elementCount = sceneSnapshot.currentPageElements.length;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Slides Editor</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => {
              if (historySnapshot.canUndo) {
                historyStore.undo();
              }
            }}
            disabled={!historySnapshot.canUndo}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              backgroundColor: historySnapshot.canUndo ? '#ffffff' : '#f3f4f6',
              color: historySnapshot.canUndo ? '#374151' : '#9ca3af',
              cursor: historySnapshot.canUndo ? 'pointer' : 'not-allowed',
            }}
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
            style={{
              padding: '6px 12px',
              fontSize: 12,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              backgroundColor: historySnapshot.canRedo ? '#ffffff' : '#f3f4f6',
              color: historySnapshot.canRedo ? '#374151' : '#9ca3af',
              cursor: historySnapshot.canRedo ? 'pointer' : 'not-allowed',
            }}
          >
            Redo
          </button>
          {rightPanelTab === 'animation' && (
            <>
              <button
                onClick={handleReset}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
              <button
                onClick={handlePreviousStep}
                disabled={!stepScheduler?.canGoBack()}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  backgroundColor: !stepScheduler?.canGoBack() ? '#9ca3af' : '#f59e0b',
                  color: '#ffffff',
                  cursor: !stepScheduler?.canGoBack() ? 'not-allowed' : 'pointer',
                }}
              >
                Previous Step
              </button>
              <button
                onClick={handleNextStep}
                disabled={!stepScheduler?.canAdvance()}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  backgroundColor: !stepScheduler?.canAdvance() ? '#9ca3af' : '#3b82f6',
                  color: '#ffffff',
                  cursor: !stepScheduler?.canAdvance() ? 'not-allowed' : 'pointer',
                }}
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
            style={{
              padding: '6px 12px',
              fontSize: 12,
              border: '1px solid #d1d5db',
              borderRadius: 4,
              backgroundColor: '#10b981',
              color: '#ffffff',
              cursor: 'pointer',
              marginLeft: 8,
            }}
          >
            Full Preview
          </button>
          <div style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
            {elementCount} elements
          </div>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <StructurePanel engine={engine} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CanvasToolbar />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Canvas engine={engine} animationEngine={animationEngine} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 400, borderLeft: '1px solid #e5e7eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
            <button
              onClick={() => setRightPanelTab('properties')}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 12,
                border: 'none',
                borderBottom: rightPanelTab === 'properties' ? '2px solid #3b82f6' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: rightPanelTab === 'properties' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontWeight: rightPanelTab === 'properties' ? 600 : 400,
              }}
            >
              Properties
            </button>
            <button
              onClick={() => setRightPanelTab('animation')}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 12,
                border: 'none',
                borderBottom: rightPanelTab === 'animation' ? '2px solid #3b82f6' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: rightPanelTab === 'animation' ? '#3b82f6' : '#6b7280',
                cursor: 'pointer',
                fontWeight: rightPanelTab === 'animation' ? 600 : 400,
              }}
            >
              Animation
            </button>
          </div>
          {rightPanelTab === 'properties' ? (
            <PropertyPanel engine={engine} />
          ) : (
            <AnimationPanel engine={engine} animationEngine={animationEngine} />
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
