import type { AnimationEffect, AnimationParams } from '../types/animation';

/**
 * Safe defaults when backend/AI omits `params` for an animation effect.
 */
export function defaultParamsForEffect(effect: AnimationEffect): AnimationParams {
  switch (effect) {
    case 'slideIn':
    case 'flyIn':
    case 'slideOut':
    case 'flyOut':
      return { direction: 'left', distance: 60 };
    case 'scale':
      return { fromScale: 1, toScale: 1.2 };
    case 'rotateIn':
    case 'rotateOut':
      return { fromAngle: 0, toAngle: 360 };
    case 'highlight':
      return { brightness: 1.5 };
    default:
      return { fromOpacity: 0, toOpacity: 1 };
  }
}
