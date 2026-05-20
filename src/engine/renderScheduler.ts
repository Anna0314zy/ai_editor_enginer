import type { Timeline } from './timeline/index';
import type { Clip } from './timeline/types';

// ============================================================================
// RenderScheduler - Frame scheduling layer
//
// Separation of concerns:
//   Timeline (Master Clock) → RenderScheduler (frame timing) → Renderer
//
// Responsibilities:
// - requestAnimationFrame loop management
// - Frame timing and dropped frame detection
// - Playback rate control
// - Active clip calculation per frame
// - Render callbacks dispatching
// ============================================================================

export interface FrameInfo {
  time: number; // Current playback time (ms)
  delta: number; // Time elapsed since last frame (ms)
  frameNumber: number; // Sequential frame count
  fps: number; // Target FPS
  droppedFrames: number; // Cumulative dropped frames
  activeClips: Clip[]; // Clips active at current time
  playbackRate: number; // Current playback speed multiplier
}

export interface RenderCallback {
  (frame: FrameInfo): void;
}

export interface RenderSchedulerOptions {
  targetFps?: number;
  maxFrameSkip?: number; // Max frames allowed to skip before forcing render
}

export class RenderScheduler {
  private timeline: Timeline;
  private rafId: number | null = null;
  private running = false;
  private lastTimestamp = 0;
  private frameNumber = 0;
  private droppedFrames = 0;
  private playbackRate = 1.0;

  // Configuration
  private targetFps: number;
  private frameInterval: number; // ms per frame
  private maxFrameSkip: number;

  // Callbacks
  private renderCallbacks = new Set<RenderCallback>();
  private unsubTimeline: (() => void) | null = null;

  // Accumulated time for frame rate limiting
  private accumulator = 0;

  constructor(timeline: Timeline, options?: RenderSchedulerOptions) {
    this.timeline = timeline;
    this.targetFps = options?.targetFps ?? timeline.getFps();
    this.frameInterval = 1000 / this.targetFps;
    this.maxFrameSkip = options?.maxFrameSkip ?? 3;

    // Subscribe to timeline state changes (play/pause)
    this.unsubTimeline = this.timeline.subscribe(() => {
      if (this.timeline.isPlaying() && !this.running) {
        this.start();
      } else if (!this.timeline.isPlaying() && this.running) {
        this.stop();
        // Emit one final frame at paused position
        this.emitFrame(0);
      }
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Register a render callback. Returns unsubscribe function. */
  onRender(callback: RenderCallback): () => void {
    this.renderCallbacks.add(callback);
    return () => this.renderCallbacks.delete(callback);
  }

  /** Get current playback rate */
  getPlaybackRate(): number {
    return this.playbackRate;
  }

  /** Set playback rate (0.25 - 4.0) */
  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
  }

  /** Get frame statistics */
  getStats(): { frameNumber: number; droppedFrames: number; fps: number } {
    return {
      frameNumber: this.frameNumber,
      droppedFrames: this.droppedFrames,
      fps: this.targetFps,
    };
  }

  /** Force a single render at current time (for seek/scrub) */
  renderAtCurrentTime(): void {
    this.emitFrame(0);
  }

  /** Check if the render loop is active */
  isRunning(): boolean {
    return this.running;
  }

  /** Destroy and cleanup */
  destroy(): void {
    this.stop();
    this.renderCallbacks.clear();
    if (this.unsubTimeline) {
      this.unsubTimeline();
      this.unsubTimeline = null;
    }
  }

  // ============================================================================
  // Internal - Render Loop
  // ============================================================================

  private start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.tick();
  }

  private stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (): void => {
    if (!this.running) return;

    const now = performance.now();
    let delta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    // Apply playback rate to delta
    delta *= this.playbackRate;

    // Accumulate time
    this.accumulator += delta;

    // Frame rate limiting: only emit when enough time accumulated
    let framesProcessed = 0;
    while (this.accumulator >= this.frameInterval && framesProcessed < this.maxFrameSkip) {
      this.accumulator -= this.frameInterval;
      framesProcessed++;
    }

    if (framesProcessed > 0) {
      // Count dropped frames (if we skipped more than 1 frame worth of time)
      if (framesProcessed > 1) {
        this.droppedFrames += framesProcessed - 1;
      }
      this.emitFrame(delta);
    }

    // Excess accumulator (cap to prevent spiral of death)
    if (this.accumulator > this.frameInterval * this.maxFrameSkip) {
      this.accumulator = 0;
      this.droppedFrames++;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private emitFrame(delta: number): void {
    const currentTime = this.timeline.getCurrentTime();
    const activeClips = this.timeline.getClipsAtTime(currentTime);

    const frame: FrameInfo = {
      time: currentTime,
      delta,
      frameNumber: this.frameNumber++,
      fps: this.targetFps,
      droppedFrames: this.droppedFrames,
      activeClips,
      playbackRate: this.playbackRate,
    };

    for (const callback of this.renderCallbacks) {
      try {
        callback(frame);
      } catch (err) {
        console.error('[RenderScheduler] Render callback error:', err);
      }
    }
  }
}
