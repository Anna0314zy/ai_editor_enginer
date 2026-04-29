export class Timeline {
  private currentTime = 0;
  private duration = 5000;
  private playing = false;
  // private animations: Animation[] = [];
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private listeners = new Set<() => void>();

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.duration;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  // setAnimations(animations: Animation[]): void {
  //   this.animations = animations;
  // }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb();
    }
  }

  play(): void {
    if (this.playing) {
      return;
    }
    this.playing = true;
    this.lastTimestamp = performance.now();
    this.notify();
    this.tick();
  }

  pause(): void {
    this.playing = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.notify();
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    this.notify();
  }

  private tick = (): void => {
    if (!this.playing) {
      return;
    }
    const now = performance.now();
    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;

    this.currentTime += delta;
    if (this.currentTime >= this.duration) {
      this.currentTime = this.duration;
      this.playing = false;
    }

    this.notify();

    if (this.playing) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };
}
