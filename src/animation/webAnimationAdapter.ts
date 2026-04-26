import type {
  WAAPIKeyframe,
  AnimationOptions,
  AnimationController,
} from '../types/animation';
import type { AnimationAdapter } from './adapter';

/**
 * WebAnimationAdapter implements AnimationAdapter using the native
 * Web Animations API (element.animate).
 */
export class WebAnimationAdapter implements AnimationAdapter {
  private cache = new WeakMap<HTMLElement, globalThis.Animation>();

  play(
    element: HTMLElement,
    keyframes: WAAPIKeyframe[],
    options: AnimationOptions
  ): AnimationController {
    // Cancel any existing animation on this element
    this.stop(element);

    const animation = element.animate(keyframes, {
      duration: options.duration,
      delay: options.delay,
      easing: options.easing,
      fill: options.fill ?? 'both',
      iterations: options.iterations ?? 1,
    });

    this.cache.set(element, animation);

    return {
      finish: () => animation.finish(),
      cancel: () => animation.cancel(),
      pause: () => animation.pause(),
      play: () => animation.play(),
      onFinish: (callback: () => void) => {
        animation.addEventListener('finish', callback, { once: true });
        animation.addEventListener('cancel', callback, { once: true });
      },
    };
  }

  stop(element: HTMLElement): void {
    const animation = this.cache.get(element);
    if (animation) {
      animation.cancel();
      this.cache.delete(element);
    }
  }

  pause(element: HTMLElement): void {
    const animation = this.cache.get(element);
    if (animation) {
      animation.pause();
    }
  }

  resume(element: HTMLElement): void {
    const animation = this.cache.get(element);
    if (animation) {
      animation.play();
    }
  }
}
