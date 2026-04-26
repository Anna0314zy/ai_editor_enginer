import { useEffect, useCallback, useMemo, useRef } from 'react';
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
  const currentSlideId = doc.currentSlideId;
  const elements = engine.scene.getSlideElements(currentSlideId);
  const slideRef = useRef<HTMLDivElement>(null);

  const scheduler = useMemo(() => new AnimationScheduler(animationEngine), [animationEngine]);

  useEffect(() => {
    const anims = engine.scene.getSlideAnimations(currentSlideId).filter((a) => a.enable);
    scheduler.load(anims);
    return () => scheduler.reset();
  }, [currentSlideId, engine, scheduler]);

  const handleCanvasClick = useCallback((): void => {
    if (scheduler.canAdvance()) {
      scheduler.playNextStep();
    }
  }, [scheduler]);

  useEffect(() => {
    animationEngine.setScopeRoot(slideRef.current);

    // Stop any running animations from edit mode
    const slideElements = engine.scene.getSlideElements(currentSlideId);
    for (const el of slideElements) {
      animationEngine.stop(el.id);
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (scheduler.canAdvance()) {
          scheduler.playNextStep();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const slideElements = engine.scene.getSlideElements(currentSlideId);
      for (const el of slideElements) {
        animationEngine.stop(el.id);
      }
      animationEngine.setScopeRoot(null);
    };
  }, [currentSlideId, animationEngine, engine, onClose, scheduler]);

  const stepCount = scheduler.getStepCount();
  const currentStep = scheduler.getCurrentStepIndex() + 1;

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
        Step {Math.min(currentStep, stepCount)} / {stepCount}
      </div>

      {/* Slide container */}
      <div
        ref={slideRef}
        style={{
          width: 960,
          height: 540,
          backgroundColor: doc.slides[currentSlideId]?.background ?? '#ffffff',
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

      {/* Hint */}
      <div
        style={{
          marginTop: 16,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
        }}
      >
        Click anywhere or press Space/Enter to advance · Press Esc to exit
      </div>
    </div>
  );
}
