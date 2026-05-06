import { useEffect, useCallback, useMemo, useRef, useState, isValidElement, cloneElement } from 'react';
import type { AnimationEngine } from '../animation';
import { AnimationScheduler, buildClickSteps, buildKeyframes } from '../animation';
import { renderElement } from '../renderer';
import { useStores, useSceneStore } from '../store';
import { PAGE_DEFAULT_WIDTH, PAGE_DEFAULT_HEIGHT } from '../types';
import type { PageBackground, Element, AnimationConfig } from '../types';

/**
 * 计算元素在预览模式下的初始样式。
 * 对于有入场动画且尚未执行的元素，应用动画第一帧的状态作为初始 CSS，
 * 确保预览时元素"从无到有"的演示效果。
 */
function getElementPreviewStyle(
  element: Element,
  steps: ReturnType<typeof buildClickSteps>,
  currentStepIndex: number
): React.CSSProperties {
  // 找到该元素的第一个 enter 动画
  let enterAnim: AnimationConfig | null = null;
  let enterStepIndex = -1;

  for (let i = 0; i < steps.length; i++) {
    for (const batch of steps[i].batches) {
      for (const anim of batch.animations) {
        if (anim.elementId === element.id && anim.type === 'enter') {
          enterAnim = anim;
          enterStepIndex = i;
          break;
        }
      }
      if (enterAnim) break;
    }
    if (enterAnim) break;
  }

  // 没有 enter 动画，或 enter 动画已经执行过 → 不添加额外样式
  if (!enterAnim || currentStepIndex >= enterStepIndex) {
    return {};
  }

  // enter 动画尚未执行 → 应用动画第一帧作为初始样式
  const keyframes = buildKeyframes(enterAnim);
  if (keyframes.length === 0) {
    return { opacity: 0, pointerEvents: 'none' };
  }

  const firstFrame = keyframes[0];
  const style: React.CSSProperties = {};

  for (const [key, value] of Object.entries(firstFrame)) {
    if (key === 'offset') continue;
    if (value !== undefined) {
      (style as Record<string, unknown>)[key] = value;
    }
  }

  // 禁止交互，避免隐藏元素阻挡点击
  style.pointerEvents = 'none';

  return style;
}

function getBackgroundStyle(background: PageBackground | undefined): React.CSSProperties {
  if (!background) return { backgroundColor: '#ffffff' };
  switch (background.type) {
    case 'solid':
      return { backgroundColor: background.color };
    case 'gradient': {
      const stops = background.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
      return { backgroundImage: `linear-gradient(${background.angle}deg, ${stops})` };
    }
    case 'image':
      return {
        backgroundImage: `url(${background.src})`,
        backgroundSize: background.fit,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: background.opacity,
      };
    default:
      return { backgroundColor: '#ffffff' };
  }
}

interface PreviewModalProps {
  animationEngine: AnimationEngine;
  onClose: () => void;
}

export default function PreviewModal({ animationEngine, onClose }: PreviewModalProps) {
  const { sceneStore } = useStores();
  const sceneSnapshot = useSceneStore(sceneStore);
  const slideRef = useRef<HTMLDivElement>(null);

  // Derive ordered page list from structureItems (preview-local ordering)
  const pageIds = useMemo(
    () => sceneSnapshot.document.structureItems.filter((item) => item.type === 'page').map((item) => item.id),
    [sceneSnapshot.document.structureItems]
  );

  // Preview maintains its own current page so it doesn't mutate editor state
  const [previewPageId, setPreviewPageId] = useState(sceneSnapshot.currentPageId);
  const currentPageIndex = pageIds.indexOf(previewPageId);
  const elements = sceneStore.getPageElements(previewPageId);

  const scheduler = useMemo(() => new AnimationScheduler(animationEngine), [animationEngine]);

  // 计算当前页面的动画 steps（用于判断元素初始可见性）
  const steps = useMemo(() => {
    const anims = sceneStore.getPageAnimations(previewPageId).filter((a) => a.enable);
    return buildClickSteps(anims);
  }, [previewPageId, sceneStore]);

  // Track step progress for UI re-rendering
  const [stepInfo, setStepInfo] = useState({ current: 0, total: 0 });

  const syncStepInfo = useCallback(() => {
    setStepInfo({
      current: scheduler.getCurrentStepIndex() + 1,
      total: scheduler.getStepCount(),
    });
  }, [scheduler]);

  useEffect(() => {
    // Register the preview page's animations into the shared engine
    // so the scheduler can actually play them.
    animationEngine.reset();
    const allAnims = sceneStore.getPageAnimations(previewPageId);
    for (const anim of allAnims) {
      if (anim.enable) animationEngine.register(anim);
    }

    const anims = allAnims.filter((a) => a.enable);
    scheduler.load(anims);
    setStepInfo({ current: 0, total: scheduler.getStepCount() });
    return () => scheduler.reset();
  }, [previewPageId, sceneStore, scheduler, animationEngine]);

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
    const anims = sceneStore.getPageAnimations(previewPageId).filter((a) => a.enable);
    scheduler.load(anims);
    syncStepInfo();
  }, [scheduler, sceneStore, previewPageId, syncStepInfo]);

  const handleNextPage = useCallback((): void => {
    if (currentPageIndex < pageIds.length - 1) {
      setPreviewPageId(pageIds[currentPageIndex + 1]);
    }
  }, [currentPageIndex, pageIds]);

  const handlePrevPage = useCallback((): void => {
    if (currentPageIndex > 0) {
      setPreviewPageId(pageIds[currentPageIndex - 1]);
    }
  }, [currentPageIndex, pageIds]);

  const handleCanvasClick = useCallback((): void => {
    handleAdvance();
  }, [handleAdvance]);

  useEffect(() => {
    animationEngine.setScopeRoot(slideRef.current);

    // Stop any running animations from edit mode
    const pageElements = sceneStore.getPageElements(previewPageId);
    for (const el of pageElements) {
      animationEngine.stop(el.id);
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAdvance();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        if (scheduler.canAdvance()) {
          handleAdvance();
        } else if (currentPageIndex < pageIds.length - 1) {
          handleNextPage();
        }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (scheduler.canGoBack()) {
          handlePrevious();
        } else if (currentPageIndex > 0) {
          handlePrevPage();
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const pageElements = sceneStore.getPageElements(previewPageId);
      for (const el of pageElements) {
        animationEngine.stop(el.id);
      }
      animationEngine.setScopeRoot(null);
    };
  }, [previewPageId, animationEngine, sceneStore, onClose, handleAdvance, handlePrevious, handleNextPage, handlePrevPage, scheduler, currentPageIndex, pageIds.length]);

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

      {/* Page + Progress indicator */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span>{`Page ${currentPageIndex + 1} / ${pageIds.length}`}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>
          {stepCount === 0
            ? 'No animations'
            : currentStep > stepCount
              ? 'Done'
              : `Step ${currentStep} / ${stepCount}`}
        </span>
      </div>

      {/* Slide container */}
      <div
        ref={slideRef}
        style={{
          width: PAGE_DEFAULT_WIDTH,
          height: PAGE_DEFAULT_HEIGHT,
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Background layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...getBackgroundStyle(sceneSnapshot.document.pages[previewPageId]?.background ?? sceneSnapshot.document.background),
          }}
        />
        {elements.map((el) => {
          const previewStyle = getElementPreviewStyle(el, steps, stepInfo.current - 1);
          const node = renderElement(el, {
            onClick: () => {}, // No element-specific triggers in preview
          });

          if (!isValidElement(node) || Object.keys(previewStyle).length === 0) {
            return node;
          }

          const existingStyle = (node.props as Record<string, unknown>).style || {};
          return cloneElement(node, {
            style: { ...existingStyle, ...previewStyle },
          } as Record<string, unknown>);
        })}
      </div>

      {/* Page navigation */}
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
            handlePrevPage();
          }}
          disabled={currentPageIndex <= 0}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            backgroundColor: currentPageIndex <= 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentPageIndex <= 0 ? 'rgba(255,255,255,0.3)' : '#ffffff',
            cursor: currentPageIndex <= 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Prev Page
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextPage();
          }}
          disabled={currentPageIndex >= pageIds.length - 1}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 4,
            backgroundColor: currentPageIndex >= pageIds.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            color: currentPageIndex >= pageIds.length - 1 ? 'rgba(255,255,255,0.3)' : '#ffffff',
            cursor: currentPageIndex >= pageIds.length - 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Next Page
        </button>
      </div>

      {/* Playback controls */}
      <div
        style={{
          marginTop: 12,
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
        Click anywhere or press Space/Enter to advance · Arrow keys to navigate pages · Press Esc to exit
      </div>
    </div>
  );
}
