export class Timeline {
  private currentTime = 0;
  private duration = 5000;
  private playing = false;
  // private animations: Animation[] = [];
  private rafId: number | null = null;
  private lastTimestamp = 0;

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

  play(): void {
    if (this.playing) {
      return;
    }
    this.playing = true;
    this.lastTimestamp = performance.now();
    this.tick();
  }

  pause(): void {
    this.playing = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.duration));
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

    if (this.playing) {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };
}
