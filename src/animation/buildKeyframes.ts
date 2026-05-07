import type {
  AnimationConfig,
  WAAPIKeyframe,
  AnimationEffect,
  SlideDirection,
} from '../types/animation';

/**
 * Build WAAPI-compatible keyframes from an AnimationConfig.
 * Pure function — no DOM dependency.
 */
export function buildKeyframes(config: AnimationConfig): WAAPIKeyframe[] {
  return buildEffectKeyframes(config.effect, config.params);
}

function normalizeSlideParams(
  params: AnimationConfig['params'] | null | undefined
): { direction: SlideDirection; distance: number } {
  const raw = (params && typeof params === 'object' ? params : {}) as Partial<{
    direction: string;
    distance: number;
  }>;
  const direction: SlideDirection =
    raw.direction === 'left' ||
    raw.direction === 'right' ||
    raw.direction === 'up' ||
    raw.direction === 'down'
      ? raw.direction
      : 'left';
  const distance =
    typeof raw.distance === 'number' && Number.isFinite(raw.distance) ? raw.distance : 60;
  return { direction, distance };
}

function buildEffectKeyframes(effect: AnimationEffect, params: AnimationConfig['params']): WAAPIKeyframe[] {
  switch (effect) {
    // Enter effects
    case 'fadeIn':
      return [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }];
    case 'zoomIn':
      return [{ offset: 0, transform: 'scale(0)', opacity: 0 }, { offset: 1, transform: 'scale(1)', opacity: 1 }];
    case 'slideIn': {
      const { direction, distance } = normalizeSlideParams(params);
      const { fromX, fromY } = getSlideOffset(direction, distance);
      return [
        { offset: 0, transform: `translate(${fromX}px, ${fromY}px)`, opacity: 0 },
        { offset: 1, transform: 'translate(0px, 0px)', opacity: 1 },
      ];
    }
    case 'flyIn': {
      const { direction, distance } = normalizeSlideParams(params);
      const { fromX, fromY } = getSlideOffset(direction, distance * 2);
      return [
        { offset: 0, transform: `translate(${fromX}px, ${fromY}px)`, opacity: 0 },
        { offset: 1, transform: 'translate(0px, 0px)', opacity: 1 },
      ];
    }
    case 'rotateIn':
      return [
        { offset: 0, transform: 'rotate(-90deg)', opacity: 0 },
        { offset: 1, transform: 'rotate(0deg)', opacity: 1 },
      ];

    // Exit effects
    case 'fadeOut':
      return [{ offset: 0, opacity: 1 }, { offset: 1, opacity: 0 }];
    case 'zoomOut':
      return [{ offset: 0, transform: 'scale(1)', opacity: 1 }, { offset: 1, transform: 'scale(0)', opacity: 0 }];
    case 'slideOut': {
      const { direction, distance } = normalizeSlideParams(params);
      const { fromX, fromY } = getSlideOffset(direction, distance);
      return [
        { offset: 0, transform: 'translate(0px, 0px)', opacity: 1 },
        { offset: 1, transform: `translate(${fromX}px, ${fromY}px)`, opacity: 0 },
      ];
    }
    case 'flyOut': {
      const { direction, distance } = normalizeSlideParams(params);
      const { fromX, fromY } = getSlideOffset(direction, distance * 2);
      return [
        { offset: 0, transform: 'translate(0px, 0px)', opacity: 1 },
        { offset: 1, transform: `translate(${fromX}px, ${fromY}px)`, opacity: 0 },
      ];
    }
    case 'rotateOut':
      return [
        { offset: 0, transform: 'rotate(0deg)', opacity: 1 },
        { offset: 1, transform: 'rotate(90deg)', opacity: 0 },
      ];

    // Emphasis effects
    case 'pulse':
      return [
        { offset: 0, transform: 'scale(1)' },
        { offset: 0.5, transform: 'scale(1.1)' },
        { offset: 1, transform: 'scale(1)' },
      ];
    case 'shake':
      return [
        { offset: 0, transform: 'translateX(0)' },
        { offset: 0.2, transform: 'translateX(-10px)' },
        { offset: 0.4, transform: 'translateX(10px)' },
        { offset: 0.6, transform: 'translateX(-10px)' },
        { offset: 0.8, transform: 'translateX(10px)' },
        { offset: 1, transform: 'translateX(0)' },
      ];
    case 'blink':
      return [
        { offset: 0, opacity: 1 },
        { offset: 0.5, opacity: 0 },
        { offset: 1, opacity: 1 },
      ];
    case 'scale': {
      const raw = (params && typeof params === 'object' ? params : {}) as Partial<{
        fromScale: number;
        toScale: number;
      }>;
      const fromScale =
        typeof raw.fromScale === 'number' && Number.isFinite(raw.fromScale) ? raw.fromScale : 1;
      const toScale =
        typeof raw.toScale === 'number' && Number.isFinite(raw.toScale) ? raw.toScale : 1.2;
      return [
        { offset: 0, transform: `scale(${fromScale})` },
        { offset: 1, transform: `scale(${toScale})` },
      ];
    }
    case 'highlight': {
      const p = params as { brightness: number };
      const brightness = p.brightness ?? 1.5;
      return [
        { offset: 0, filter: 'none' },
        { offset: 0.5, filter: `brightness(${brightness})` },
        { offset: 1, filter: 'none' },
      ];
    }

    default:
      return [];
  }
}

function getSlideOffset(direction: SlideDirection, distance: number): { fromX: number; fromY: number } {
  const d = Number.isFinite(distance) ? distance : 60;
  switch (direction) {
    case 'left':
      return { fromX: -d, fromY: 0 };
    case 'right':
      return { fromX: d, fromY: 0 };
    case 'up':
      return { fromX: 0, fromY: -d };
    case 'down':
      return { fromX: 0, fromY: d };
  }
}
