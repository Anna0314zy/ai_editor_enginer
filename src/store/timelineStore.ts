import { BaseStore } from './baseStore';
import type { Timeline } from '../engine/timeline/index';
import type { TimelineProject, Clip, Track } from '../engine/timeline/types';

// ============================================================================
// TimelineStore - Reactive state for the multi-track Timeline panel
// ============================================================================

export interface TimelineSnapshot {
  project: TimelineProject;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  // UI viewport state
  zoom: number; // px per ms
  scrollLeft: number; // horizontal scroll offset (ms)
  viewportStart: number; // visible time range start (ms)
  viewportEnd: number; // visible time range end (ms)
}

const DEFAULT_ZOOM = 0.1; // 0.1 px/ms = 100px per second
const DEFAULT_VIEWPORT_WIDTH_MS = 10000; // 10 seconds visible by default

export class TimelineStore extends BaseStore<TimelineSnapshot> {
  private timeline: Timeline;
  private unsubscribe: (() => void) | null = null;

  // UI state (not in engine, managed here)
  private selectedClipId: string | null = null;
  private selectedTrackId: string | null = null;
  private zoom = DEFAULT_ZOOM;
  private scrollLeft = 0;
  private viewportWidthPx = 1000; // Will be updated from container width

  constructor(timeline: Timeline) {
    super();
    this.timeline = timeline;
    this.unsubscribe = this.timeline.subscribe(() => this.emit());
  }

  /** 重新挂载对 timeline 的订阅（用于 StrictMode 下 destroy 后再 mount 的场景） */
  attach(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.timeline.subscribe(() => this.emit());
    this.emit();
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  protected buildSnapshot(): TimelineSnapshot {
    const viewportWidthMs = this.viewportWidthPx / this.zoom;
    return {
      project: this.timeline.getProject(),
      currentTime: this.timeline.getCurrentTime(),
      duration: this.timeline.getDuration(),
      isPlaying: this.timeline.isPlaying(),
      selectedClipId: this.selectedClipId,
      selectedTrackId: this.selectedTrackId,
      zoom: this.zoom,
      scrollLeft: this.scrollLeft,
      viewportStart: this.scrollLeft,
      viewportEnd: this.scrollLeft + viewportWidthMs,
    };
  }

  // === UI Actions ===

  selectClip(clipId: string | null): void {
    this.selectedClipId = clipId;
    this.emit();
  }

  selectTrack(trackId: string | null): void {
    this.selectedTrackId = trackId;
    this.emit();
  }

  setZoom(zoom: number): void {
    // Clamp zoom: 0.01 (very zoomed out) to 1.0 (very zoomed in)
    this.zoom = Math.max(0.01, Math.min(1.0, zoom));
    this.emit();
  }

  setScrollLeft(scrollLeft: number): void {
    this.scrollLeft = Math.max(0, scrollLeft);
    this.emit();
  }

  setViewportWidthPx(width: number): void {
    this.viewportWidthPx = width;
    this.emit();
  }

  /** Zoom in/out centered on a specific time position */
  zoomAt(centerTime: number, factor: number): void {
    const oldZoom = this.zoom;
    const newZoom = Math.max(0.01, Math.min(1.0, oldZoom * factor));
    // Adjust scrollLeft so centerTime stays at same pixel position
    const centerPx = (centerTime - this.scrollLeft) * oldZoom;
    const newScrollLeft = centerTime - centerPx / newZoom;
    this.zoom = newZoom;
    this.scrollLeft = Math.max(0, newScrollLeft);
    this.emit();
  }

  // === Playback delegation ===

  play(): void {
    this.timeline.play();
  }

  pause(): void {
    this.timeline.pause();
  }

  seek(time: number): void {
    this.timeline.seek(time);
  }

  togglePlay(): void {
    if (this.timeline.isPlaying()) {
      this.timeline.pause();
    } else {
      this.timeline.play();
    }
  }

  // === Getters for direct access ===

  getTimeline(): Timeline {
    return this.timeline;
  }

  getSelectedClip(): Clip | undefined {
    if (!this.selectedClipId) return undefined;
    return this.timeline.getClip(this.selectedClipId);
  }

  getSelectedTrack(): Track | undefined {
    if (!this.selectedTrackId) return undefined;
    return this.timeline.getTrack(this.selectedTrackId);
  }
}
