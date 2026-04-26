import type { WAAPIKeyframe, AnimationOptions, AnimationController } from '../types/animation';

/**
 * AnimationAdapter abstracts the underlying animation library.
 * Implementations: WebAnimationAdapter (WAAPI), GSAPAdapter (GSAP).
 */
export interface AnimationAdapter {
  /**
   * Play an animation on the given element.
   * Returns a controller to manage the animation lifecycle.
   */
  play(
    element: HTMLElement,
    keyframes: WAAPIKeyframe[],
    options: AnimationOptions
  ): AnimationController;

  /** Stop (cancel) the animation on the given element. */
  stop(element: HTMLElement): void;

  /** Pause the animation on the given element. */
  pause(element: HTMLElement): void;

  /** Resume the paused animation on the given element. */
  resume(element: HTMLElement): void;
}
