import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import type { Engine } from '../engine';
import type { AnimationEngine } from '../animation';
import { AnimationScheduler } from '../animation';
import { renderElement } from '../renderer';

interface PreviewModalProps {
  engine: Engine;
  animationEngine: AnimationEngine;
  onClose: () => void;
}

export default function PreviewModal({ engine, animationEngine, onClose }: PreviewModalProps) {
  const doc = engine.scene.getDocument();
  const currentPageId = doc.currentPageId;
  const elements = engine.scene.getPageElements(currentPageId);
  const slideRef = useRef<HTMLDivElement>(null);

  const scheduler = useMemo(() => new AnimationScheduler(animationEngine), [animationEngine]);

  // Track step progress for UI re-rendering
  const [stepInfo, setStepInfo] = useState({ current: 0, total: 0 });

  const syncStepInfo = useCallback(() => {
    setStepInfo({
      current: scheduler.getCurrentStepIndex() + 1,
      total: scheduler.getStepCount(),
    });
  }, [scheduler]);

  useEffect(() => {
    const anims = engine.scene.getPageAnimations(currentPageId).filter((a) => a.enable);
    scheduler.load(anims);
    setStepInfo({ current: 0, total: scheduler.getStepCount() });
    return () => scheduler.reset();
  }, [currentPageId, engine, scheduler]);

  const handleAdvance = useCallback((): void => {
    if (scheduler.canAdvance()) {
      scheduler.playNextStep();
      syncStepInfo();
    }
  }, [scheduler, syncStepInfo]);

  const handlePrevious = useCallback((): void => {
    if (scheduler.canGoBack()) {
      scheduler.playPreviousStep();
      syncStepInfo();
    }
  }, [scheduler, syncStepInfo]);

  const handleReset = useCallback((): void => {
    scheduler.reset();
    const anims = engine.scene.getPageAnimations(currentPageId).filter((a) => a.enable);
    scheduler.load(anims);
    syncStepInfo();
  }, [scheduler, engine, currentPageId, syncStepInfo]);

  const handleCanvasClick = useCallback((): void => {
    handleAdvance();
  }, [handleAdvance]);

  useEffect(() => {
    animationEngine.setScopeRoot(slideRef.current);

    // Stop any running animations from edit mode
    const pageElements = engine.scene.getPageElements(currentPageId);
    for (const el of pageElements) {
      animationEngine.stop(el.id);
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const pageElements = engine.scene.getPageElements(currentPageId);
      for (const el of pageElements) {
        animationEngine.stop(el.id);
      }
      animationEngine.setScopeRoot(null);
    };
  }, [currentPageId, animationEngine, engine, onClose, handleAdvance]);

  const { current: currentStep, total: stepCount } = stepInfo;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
      onClick={handleCanvasClick}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#ffffff',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Close preview (Esc)"
      >
        ×
      </button>

      {/* Progress indicator */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {stepCount === 0
          ? 'No animations'
          : currentStep > stepCount
            ? 'Done'
            : `Step ${currentStep} / ${stepCount}`}
      </div>

      {/* Slide container */}
      <div
        ref={slideRef}
        style={{
          width: 960,
          height: 540,
          backgroundColor: doc.pages[currentPageId]?.background ?? '#ffffff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {elements.map((el) =>
          renderElement(el, {
            onClick: () => {}, // No element-specific triggers in preview
          })
        )}
      </div>

      {/* Playback controls */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          disabled={!scheduler.canGoBack()}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            backgroundColor: !scheduler.canGoBack() ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: !scheduler.canGoBack() ? 'rgba(255,255,255,0.3)' : '#ffffff',
            cursor: !scheduler.canGoBack() ? 'not-allowed' : 'pointer',
          }}
        >
          Previous Step
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdvance();
          }}
          disabled={!scheduler.canAdvance()}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            backgroundColor: !scheduler.canAdvance() ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: !scheduler.canAdvance() ? 'rgba(255,255,255,0.3)' : '#ffffff',
            cursor: !scheduler.canAdvance() ? 'not-allowed' : 'pointer',
          }}
        >
          Next Step
        </button>
      </div>

      {/* Hint */}
      <div
        style={{
          marginTop: 12,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
        }}
      >
        Click anywhere or press Space/Enter to advance · Press Esc to exit
      </div>
    </div>
  );
}
