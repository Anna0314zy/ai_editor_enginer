// Animation system types for the AnimationEngine + Adapter architecture
// These are separate from the timeline Animation types in index.ts

export type AnimationType = 'enter' | 'emphasis' | 'exit';

export type AnimationEffect =
  // Enter
  | 'fadeIn' | 'zoomIn' | 'slideIn' | 'flyIn' | 'rotateIn'
  // Emphasis
  | 'pulse' | 'shake' | 'blink' | 'scale' | 'highlight'
  // Exit
  | 'fadeOut' | 'zoomOut' | 'slideOut' | 'flyOut' | 'rotateOut';

export type StartType = 'click' | 'withPrev' | 'afterPrev';

export type EasingPreset =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export interface AnimationConfig {
  id: string;
  elementId: string;
  name: string;
  enable: boolean;
  type: AnimationType;
  effect: AnimationEffect;
  startType: StartType;
  duration: number; // seconds
  delay: number;    // seconds
  easing: EasingPreset;
  repeatCount: number;
  params: AnimationParams;
}

export type AnimationParams =
  | FadeParams
  | SlideParams
  | ScaleParams
  | RotateParams
  | HighlightParams;

export interface FadeParams {
  fromOpacity: number;
  toOpacity: number;
}

export interface SlideParams {
  direction: SlideDirection;
  distance: number; // px
}

export interface ScaleParams {
  fromScale: number;
  toScale: number;
}

export interface RotateParams {
  fromAngle: number;
  toAngle: number;
}

export interface HighlightParams {
  brightness: number;
}

/**
 * WAAPI-compatible keyframe format.
 * Each keyframe is an object where keys are CSS properties and values are strings/numbers.
 * The special `offset` key (0-1) represents the timeline position.
 */
export interface WAAPIKeyframe {
  offset?: number;
  [property: string]: string | number | undefined;
}

export interface AnimationOptions {
  duration: number;
  delay: number;
  easing: string;
  fill?: FillMode;
  iterations?: number;
}

export type FillMode = 'none' | 'forwards' | 'backwards' | 'both' | 'auto';

export interface AnimationController {
  finish(): void;
  cancel(): void;
  pause(): void;
  play(): void;
  onFinish(callback: () => void): void;
}

// ============================================================================
// Scheduler Types
// ============================================================================

export interface AnimationBatch {
  id: string;
  animations: AnimationConfig[];
}

export interface ClickStep {
  id: string;
  batches: AnimationBatch[];
}
