import gsap from 'gsap';
import type {
  WAAPIKeyframe,
  AnimationOptions,
  AnimationController,
} from '../types/animation';
import type { AnimationAdapter } from './adapter';

/**
 * GSAPAdapter implements AnimationAdapter using GSAP.
 * Maps WAAPI-style keyframes to GSAP fromTo syntax.
 */
export class GSAPAdapter implements AnimationAdapter {
  private tweens = new WeakMap<HTMLElement, gsap.core.Tween>();

  play(
    element: HTMLElement,
    keyframes: WAAPIKeyframe[],
    options: AnimationOptions
  ): AnimationController {
    this.stop(element);

    if (keyframes.length < 2) {
      return {
        finish: () => {},
        cancel: () => {},
        pause: () => {},
        play: () => {},
        onFinish: () => {},
      };
    }

    const fromFrame = keyframes[0];
    const toFrame = keyframes[keyframes.length - 1];

    // Extract transform components
    const fromVars = this.frameToGSAPVars(fromFrame);
    const toVars = this.frameToGSAPVars(toFrame);

    // GSAP options
    toVars.duration = options.duration / 1000; // ms -> s
    toVars.delay = options.delay / 1000;
    toVars.ease = this.mapEasing(options.easing);

    const tween = gsap.fromTo(element, fromVars, toVars);
    this.tweens.set(element, tween);

    return {
      finish: () => tween.progress(1),
      cancel: () => {
        tween.kill();
        this.tweens.delete(element);
      },
      pause: () => tween.pause(),
      play: () => tween.play(),
      onFinish: (callback: () => void) => {
        tween.eventCallback('onComplete', callback);
      },
    };
  }

  stop(element: HTMLElement): void {
    const tween = this.tweens.get(element);
    if (tween) {
      tween.kill();
      this.tweens.delete(element);
    }
  }

  pause(element: HTMLElement): void {
    const tween = this.tweens.get(element);
    if (tween) {
      tween.pause();
    }
  }

  resume(element: HTMLElement): void {
    const tween = this.tweens.get(element);
    if (tween) {
      tween.play();
    }
  }

  /**
   * Convert a WAAPI keyframe object to GSAP vars object.
   */
  private frameToGSAPVars(frame: WAAPIKeyframe): gsap.TweenVars {
    const vars: gsap.TweenVars = {};

    for (const [key, value] of Object.entries(frame)) {
      if (key === 'offset') continue;
      if (value === undefined) continue;

      if (key === 'transform') {
        this.parseTransform(value as string, vars);
      } else {
        (vars as Record<string, unknown>)[key] = value;
      }
    }

    return vars;
  }

  /**
   * Parse a CSS transform string into GSAP-friendly x/y/rotation/scale props.
   */
  private parseTransform(transform: string, vars: gsap.TweenVars): void {
    const translateMatch = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
    if (translateMatch) {
      vars.x = parseFloat(translateMatch[1]);
      vars.y = parseFloat(translateMatch[2]);
    }

    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    if (scaleMatch) {
      vars.scale = parseFloat(scaleMatch[1]);
    }

    const rotateMatch = transform.match(/rotate\(([^)]+)deg\)/);
    if (rotateMatch) {
      vars.rotation = parseFloat(rotateMatch[1]);
    }
  }

  /**
   * Map easing names from WAAPI presets to GSAP ease strings.
   */
  private mapEasing(easing: string): string {
    const map: Record<string, string> = {
      linear: 'none',
      'ease-in': 'power1.in',
      'ease-out': 'power1.out',
      'ease-in-out': 'power1.inOut',
      bounce: 'bounce.out',
      elastic: 'elastic.out(1, 0.3)',
    };
    return map[easing] ?? easing;
  }
}
