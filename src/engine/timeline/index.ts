import type { Clip, Track, TimelineProject, MediaResource } from './types';
import { syncClipEndTime } from './types';

// ============================================================================
// Timeline Engine - Master Clock + Multi-Track Management
// Timeline is the single source of truth for time progression.
// It does NOT directly drive rendering; RenderScheduler does that.
// ============================================================================

function createEmptyProject(): TimelineProject {
  return {
    id: 'project-default',
    tracks: [],
    resources: [],
    duration: 0,
    fps: 30,
  };
}

export class Timeline {
  // === Master Clock ===
  private currentTime = 0;
  private duration = 0;
  private playing = false;
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private listeners = new Set<() => void>();

  // === Multi-Track Data ===
  private project: TimelineProject;

  constructor(project?: TimelineProject) {
    this.project = project ?? createEmptyProject();
    this.recalcDuration();
  }

  // ============================================================================
  // Subscriptions
  // ============================================================================

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    for (const cb of this.listeners) {
      cb();
    }
  }

  // ============================================================================
  // Master Clock API
  // ============================================================================

  getCurrentTime(): number {
    return this.currentTime;
  }

  getDuration(): number {
    return this.duration;
  }

  setDuration(duration: number): void {
    this.duration = Math.max(0, duration);
    if (this.currentTime > this.duration) {
      this.currentTime = this.duration;
    }
    this.notify();
  }

  isPlaying(): boolean {
    return this.playing;
  }

  play(): void {
    if (this.playing) return;
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
    if (!this.playing) return;

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

  // ============================================================================
  // Project
  // ============================================================================

  getProject(): TimelineProject {
    return this.project;
  }

  setProject(project: TimelineProject): void {
    this.project = project;
    this.recalcDuration();
    this.notify();
  }

  getFps(): number {
    return this.project.fps;
  }

  // ============================================================================
  // Track CRUD
  // ============================================================================

  getTracks(): Track[] {
    return this.project.tracks;
  }

  getTrack(trackId: string): Track | undefined {
    return this.project.tracks.find((t) => t.id === trackId);
  }

  addTrack(track: Track): void {
    this.project.tracks.push(track);
    this.project.tracks.sort((a, b) => a.order - b.order);
    this.notify();
  }

  removeTrack(trackId: string): void {
    this.project.tracks = this.project.tracks.filter((t) => t.id !== trackId);
    this.recalcDuration();
    this.notify();
  }

  reorderTracks(trackIds: string[]): void {
    const trackMap = new Map(this.project.tracks.map((t) => [t.id, t]));
    const reordered: Track[] = [];
    for (let i = 0; i < trackIds.length; i++) {
      const track = trackMap.get(trackIds[i]);
      if (track) {
        track.order = i;
        reordered.push(track);
      }
    }
    // Append any tracks not in the list
    for (const track of this.project.tracks) {
      if (!trackIds.includes(track.id)) {
        reordered.push(track);
      }
    }
    this.project.tracks = reordered;
    this.notify();
  }

  updateTrack(trackId: string, updates: Partial<Omit<Track, 'id' | 'clips'>>): void {
    const track = this.getTrack(trackId);
    if (track) {
      Object.assign(track, updates);
      this.notify();
    }
  }

  // ============================================================================
  // Clip CRUD
  // ============================================================================

  getClip(clipId: string): Clip | undefined {
    for (const track of this.project.tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return clip;
    }
    return undefined;
  }

  addClip(trackId: string, clip: Clip): void {
    const track = this.getTrack(trackId);
    if (!track) return;
    // Ensure endTime is synced
    clip.endTime = clip.startTime + clip.duration;
    clip.trackId = trackId;
    track.clips.push(clip);
    track.clips.sort((a, b) => a.startTime - b.startTime);
    this.recalcDuration();
    this.notify();
  }

  removeClip(clipId: string): void {
    for (const track of this.project.tracks) {
      const idx = track.clips.findIndex((c) => c.id === clipId);
      if (idx >= 0) {
        track.clips.splice(idx, 1);
        this.recalcDuration();
        this.notify();
        return;
      }
    }
  }

  moveClip(clipId: string, newTrackId: string, newStartTime: number): void {
    // Find and remove from current track
    let clip: Clip | undefined;
    for (const track of this.project.tracks) {
      const idx = track.clips.findIndex((c) => c.id === clipId);
      if (idx >= 0) {
        clip = track.clips.splice(idx, 1)[0];
        break;
      }
    }
    if (!clip) return;

    // Update position
    clip.startTime = Math.max(0, newStartTime);
    clip.trackId = newTrackId;
    clip.endTime = clip.startTime + clip.duration;

    // Add to new track
    const newTrack = this.getTrack(newTrackId);
    if (newTrack) {
      newTrack.clips.push(clip);
      newTrack.clips.sort((a, b) => a.startTime - b.startTime);
    }

    this.recalcDuration();
    this.notify();
  }

  resizeClip(clipId: string, newStartTime: number, newDuration: number): void {
    const clip = this.getClip(clipId);
    if (!clip) return;

    clip.startTime = Math.max(0, newStartTime);
    clip.duration = Math.max(1, newDuration); // Minimum 1ms
    clip.endTime = clip.startTime + clip.duration;

    // Re-sort in parent track
    const track = this.getTrack(clip.trackId);
    if (track) {
      track.clips.sort((a, b) => a.startTime - b.startTime);
    }

    this.recalcDuration();
    this.notify();
  }

  splitClip(clipId: string, splitTime: number): [Clip, Clip] | null {
    const clip = this.getClip(clipId);
    if (!clip) return null;

    // splitTime must be within the clip
    if (splitTime <= clip.startTime || splitTime >= clip.endTime) return null;

    const track = this.getTrack(clip.trackId);
    if (!track) return null;

    const splitOffset = splitTime - clip.startTime;

    // First half
    const firstHalf: Clip = syncClipEndTime({
      ...clip,
      duration: splitOffset,
      endTime: 0, // will be synced
    });

    // Second half
    const secondHalf: Clip = syncClipEndTime({
      ...clip,
      id: `${clip.id}-split-${Date.now()}`,
      startTime: splitTime,
      duration: clip.duration - splitOffset,
      inPoint: clip.inPoint + splitOffset,
      endTime: 0, // will be synced
    });

    // Replace original with both halves
    const idx = track.clips.findIndex((c) => c.id === clipId);
    if (idx >= 0) {
      track.clips.splice(idx, 1, firstHalf, secondHalf);
    }

    this.recalcDuration();
    this.notify();
    return [firstHalf, secondHalf];
  }

  updateClip(clipId: string, updates: Partial<Clip>): void {
    const clip = this.getClip(clipId);
    if (!clip) return;
    Object.assign(clip, updates);
    // Sync endTime if startTime or duration changed
    if ('startTime' in updates || 'duration' in updates) {
      clip.endTime = clip.startTime + clip.duration;
    }
    this.recalcDuration();
    this.notify();
  }

  // ============================================================================
  // Queries (supports virtualization)
  // ============================================================================

  /** Get all clips active at a specific time point */
  getClipsAtTime(time: number): Clip[] {
    const result: Clip[] = [];
    for (const track of this.project.tracks) {
      if (!track.visible) continue;
      for (const clip of track.clips) {
        if (clip.startTime <= time && clip.endTime > time) {
          result.push(clip);
        }
      }
    }
    return result;
  }

  /** Get clips visible within a time viewport (for UI virtualization) */
  getVisibleClips(viewportStart: number, viewportEnd: number): Map<string, Clip[]> {
    const result = new Map<string, Clip[]>();
    for (const track of this.project.tracks) {
      const visible: Clip[] = [];
      for (const clip of track.clips) {
        // Clip overlaps viewport if clip.startTime < viewportEnd && clip.endTime > viewportStart
        if (clip.startTime < viewportEnd && clip.endTime > viewportStart) {
          visible.push(clip);
        }
      }
      result.set(track.id, visible);
    }
    return result;
  }

  // ============================================================================
  // Resource Management (delegated, stored in project)
  // ============================================================================

  addResource(resource: MediaResource): void {
    this.project.resources.push(resource);
    this.notify();
  }

  removeResource(resourceId: string): void {
    this.project.resources = this.project.resources.filter((r) => r.id !== resourceId);
    this.notify();
  }

  getResource(resourceId: string): MediaResource | undefined {
    return this.project.resources.find((r) => r.id === resourceId);
  }

  // ============================================================================
  // Internal
  // ============================================================================

  private recalcDuration(): void {
    let maxEnd = 0;
    for (const track of this.project.tracks) {
      for (const clip of track.clips) {
        if (clip.endTime > maxEnd) {
          maxEnd = clip.endTime;
        }
      }
    }
    this.duration = maxEnd || 5000; // Default 5s if empty
  }
}
