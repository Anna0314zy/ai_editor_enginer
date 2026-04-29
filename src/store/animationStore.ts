import { EngineStore } from './baseStore';
import type { Engine } from '../engine';
import type { AnimationConfig } from '../types';

export interface AnimationSnapshot {
  currentPageAnimations: AnimationConfig[];
  currentPageId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

export class AnimationStore extends EngineStore<AnimationSnapshot> {
  private unsubscribeTimeline: (() => void) | null = null;

  constructor(engine: Engine) {
    super(engine, ['scene']);
    this.unsubscribeTimeline = this.engine.timeline.subscribe(() => this.emit());
  }

  destroy(): void {
    if (this.unsubscribeTimeline) {
      this.unsubscribeTimeline();
      this.unsubscribeTimeline = null;
    }
  }

  protected buildSnapshot(): AnimationSnapshot {
    const currentPageId = this.engine.scene.getDocument().currentPageId;
    return {
      currentPageAnimations: this.engine.scene.getPageAnimations(currentPageId),
      currentPageId,
      currentTime: this.engine.timeline.getCurrentTime(),
      duration: this.engine.timeline.getDuration(),
      isPlaying: this.engine.timeline.isPlaying(),
    };
  }

  getAnimation(id: string): AnimationConfig | undefined {
    return this.engine.scene.getAnimation(id);
  }

  getAnimationsByElementId(elementId: string): AnimationConfig[] {
    const currentPageId = this.engine.scene.getDocument().currentPageId;
    return this.engine.scene.getPageAnimations(currentPageId).filter((a) => a.elementId === elementId);
  }

  play(): void {
    this.engine.timeline.play();
  }

  pause(): void {
    this.engine.timeline.pause();
  }

  seek(time: number): void {
    this.engine.timeline.seek(time);
  }
}
