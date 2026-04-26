import type { AnimationConfig, AnimationOptions } from '../types/animation';
import type { AnimationAdapter } from './adapter';
import { buildKeyframes } from './buildKeyframes';

/**
 * AnimationEngine controls the animation lifecycle.
 * It holds animation configs, builds keyframes, and delegates playback to an Adapter.
 */
export class AnimationEngine {
  private configs = new Map<string, AnimationConfig>();
  private adapter: AnimationAdapter;
  /** Optional root element to scope DOM queries (e.g. preview container). */
  private scopeRoot: HTMLElement | null = null;

  constructor(adapter: AnimationAdapter) {
    this.adapter = adapter;
  }

  /** Restrict DOM element queries to the given root element. Pass null to clear. */
  setScopeRoot(root: HTMLElement | null): void {
    this.scopeRoot = root;
  }

  private queryElement(elementId: string): HTMLElement | null {
    const selector = `[data-element-id="${elementId}"]`;
    if (this.scopeRoot) {
      return this.scopeRoot.querySelector<HTMLElement>(selector);
    }
    return document.querySelector<HTMLElement>(selector);
  }

  /** Register or update an animation config. */
  register(config: AnimationConfig): void {
    this.configs.set(config.id, config);
  }

  /** Remove an animation config. */
  unregister(configId: string): void {
    this.configs.delete(configId);
  }

  /** Get all registered configs. */
  getAllConfigs(): AnimationConfig[] {
    return Array.from(this.configs.values());
  }

  /** Get a single config by id. */
  getConfig(configId: string): AnimationConfig | undefined {
    return this.configs.get(configId);
  }

  /** Play an animation by config id. Returns controller for lifecycle management. */
  play(configId: string) {
    const config = this.configs.get(configId);
    if (!config) return null;

    const element = this.queryElement(config.elementId);
    if (!element) return null;

    const keyframes = buildKeyframes(config);
    const options: AnimationOptions = {
      duration: config.duration * 1000,
      delay: config.delay * 1000,
      easing: config.easing,
      fill: 'both',
      iterations: config.repeatCount || 1,
    };

    return this.adapter.play(element, keyframes, options);
  }

  /** Play all animations registered for an element. */
  playAllForElement(elementId: string) {
    const configs = this.getAllConfigs().filter((c) => c.elementId === elementId);
    const controllers = [];
    for (const config of configs) {
      const ctrl = this.play(config.id);
      if (ctrl) controllers.push(ctrl);
    }
    return controllers;
  }

  /** Stop animation on the given element. */
  stop(elementId: string): void {
    const element = this.queryElement(elementId);
    if (element) {
      this.adapter.stop(element);
    }
  }

  /** Stop all animations on all elements. */
  stopAll(): void {
    for (const config of this.configs.values()) {
      this.stop(config.elementId);
    }
  }

  /** Pause animation on the given element. */
  pause(elementId: string): void {
    const element = this.queryElement(elementId);
    if (element) {
      this.adapter.pause(element);
    }
  }

  /** Resume animation on the given element. */
  resume(elementId: string): void {
    const element = this.queryElement(elementId);
    if (element) {
      this.adapter.resume(element);
    }
  }

  /** Reset all registered configs. */
  reset(): void {
    this.stopAll();
    this.configs.clear();
  }
}
