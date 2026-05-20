import type { RenderScheduler, FrameInfo } from '../engine/renderScheduler';
import type { Timeline } from '../engine/timeline/index';
import type { Clip, VideoClip, AudioClip } from '../engine/timeline/types';

// ============================================================================
// MediaSyncManager - Synchronizes HTMLVideoElement/AudioElement with Timeline
//
// Architecture:
//   Timeline (Master Clock)
//       ↓
//   RenderScheduler (frame dispatch)
//       ↓
//   MediaSyncManager (sync media elements to current time)
//
// Key principles:
// - Timeline.currentTime is the SINGLE source of truth
// - Video/Audio elements follow Timeline, NOT the other way around
// - Uses seek threshold to avoid constant seeking (±50ms tolerance)
// - Manages element lifecycle (create/pool/destroy)
// ============================================================================

export interface ManagedMedia {
  clipId: string;
  resourceId: string;
  element: HTMLVideoElement | HTMLAudioElement;
  type: 'video' | 'audio';
  isReady: boolean;
}

export interface MediaSyncOptions {
  /** Time sync tolerance (ms). Won't re-seek if drift < threshold. */
  syncThreshold?: number;
  /** Volume for audio/video (0-1) */
  masterVolume?: number;
  /** Container element for video elements */
  videoContainer?: HTMLElement;
}

const DEFAULT_SYNC_THRESHOLD = 50; // ms

export class MediaSyncManager {
  private timeline: Timeline;
  private scheduler: RenderScheduler;
  private managedMedia = new Map<string, ManagedMedia>(); // clipId → managed
  private unsubRender: (() => void) | null = null;
  private unsubTimeline: (() => void) | null = null;

  // Configuration
  private syncThreshold: number;
  private masterVolume: number;
  private videoContainer: HTMLElement | null;

  // State tracking
  private lastPlayingState = false;
  private seekingClips = new Set<string>(); // Clips currently seeking (avoid re-seek)

  constructor(timeline: Timeline, scheduler: RenderScheduler, options?: MediaSyncOptions) {
    this.timeline = timeline;
    this.scheduler = scheduler;
    this.syncThreshold = options?.syncThreshold ?? DEFAULT_SYNC_THRESHOLD;
    this.masterVolume = options?.masterVolume ?? 1.0;
    this.videoContainer = options?.videoContainer ?? null;

    // Subscribe to render frames for continuous sync
    this.unsubRender = this.scheduler.onRender((frame) => this.onFrame(frame));

    // Subscribe to timeline for play/pause/seek events
    this.unsubTimeline = this.timeline.subscribe(() => this.onTimelineChange());
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /** Set master volume (affects all managed media) */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    for (const media of this.managedMedia.values()) {
      this.applyVolume(media);
    }
  }

  /** Get master volume */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /** Pre-create a media element for a clip (called when clip enters viewport) */
  prepareClip(clip: Clip, src: string): ManagedMedia | null {
    if (clip.type !== 'video' && clip.type !== 'audio') return null;
    if (this.managedMedia.has(clip.id)) return this.managedMedia.get(clip.id)!;

    const element = this.createElement(clip.type, src);
    const managed: ManagedMedia = {
      clipId: clip.id,
      resourceId: clip.resourceId ?? '',
      element,
      type: clip.type,
      isReady: false,
    };

    // Wait for element to be ready
    const onCanPlay = () => {
      managed.isReady = true;
      element.removeEventListener('canplay', onCanPlay);
    };
    element.addEventListener('canplay', onCanPlay);
    if (element.readyState >= 3) {
      managed.isReady = true;
    }

    this.managedMedia.set(clip.id, managed);
    this.applyVolume(managed);

    return managed;
  }

  /** Release a media element for a clip */
  releaseClip(clipId: string): void {
    const managed = this.managedMedia.get(clipId);
    if (!managed) return;

    managed.element.pause();
    managed.element.src = '';
    managed.element.load(); // Release resources

    if (managed.element.parentNode) {
      managed.element.parentNode.removeChild(managed.element);
    }

    this.managedMedia.delete(clipId);
    this.seekingClips.delete(clipId);
  }

  /** Release all managed media */
  releaseAll(): void {
    for (const clipId of [...this.managedMedia.keys()]) {
      this.releaseClip(clipId);
    }
  }

  /** Get the video element for a clip (for rendering in preview) */
  getVideoElement(clipId: string): HTMLVideoElement | null {
    const managed = this.managedMedia.get(clipId);
    if (!managed || managed.type !== 'video') return null;
    return managed.element as HTMLVideoElement;
  }

  /** Destroy and cleanup */
  destroy(): void {
    this.releaseAll();
    if (this.unsubRender) {
      this.unsubRender();
      this.unsubRender = null;
    }
    if (this.unsubTimeline) {
      this.unsubTimeline();
      this.unsubTimeline = null;
    }
  }

  // ============================================================================
  // Internal - Frame Sync
  // ============================================================================

  private onFrame(frame: FrameInfo): void {
    const currentTime = frame.time;

    for (const clip of frame.activeClips) {
      if (clip.type !== 'video' && clip.type !== 'audio') continue;

      const managed = this.managedMedia.get(clip.id);
      if (!managed || !managed.isReady) continue;

      // Calculate where the element should be within the source media
      const clipLocalTime = currentTime - clip.startTime + clip.inPoint;
      const elementTime = clipLocalTime / 1000; // Convert to seconds for HTMLMediaElement

      // Check sync drift
      const currentElementTime = managed.element.currentTime * 1000;
      const drift = Math.abs(currentElementTime - clipLocalTime);

      if (drift > this.syncThreshold && !this.seekingClips.has(clip.id)) {
        // Need to resync
        this.seekElement(managed, elementTime);
      }

      // Ensure playback rate matches
      const rate = this.scheduler.getPlaybackRate();
      if (clip.type === 'video') {
        const speed = (clip as VideoClip).speed ?? 1;
        managed.element.playbackRate = rate * speed;
      } else {
        managed.element.playbackRate = rate;
      }

      // Ensure playing state matches timeline
      if (this.timeline.isPlaying() && managed.element.paused) {
        managed.element.play().catch(() => {
          /* autoplay blocked */
        });
      }
    }

    // Pause elements for clips that are no longer active
    for (const [clipId, managed] of this.managedMedia) {
      const isActive = frame.activeClips.some((c) => c.id === clipId);
      if (!isActive && !managed.element.paused) {
        managed.element.pause();
      }
    }
  }

  private onTimelineChange(): void {
    const isPlaying = this.timeline.isPlaying();

    // Play/Pause transition
    if (isPlaying !== this.lastPlayingState) {
      this.lastPlayingState = isPlaying;

      if (!isPlaying) {
        // Pause all
        for (const managed of this.managedMedia.values()) {
          managed.element.pause();
        }
      }
      // If started playing, sync will happen in next onFrame
    }

    // Seek event detection: if not playing, user manually seeked
    if (!isPlaying) {
      this.syncAllToCurrentTime();
    }
  }

  private syncAllToCurrentTime(): void {
    const currentTime = this.timeline.getCurrentTime();
    const activeClips = this.timeline.getClipsAtTime(currentTime);

    for (const clip of activeClips) {
      if (clip.type !== 'video' && clip.type !== 'audio') continue;
      const managed = this.managedMedia.get(clip.id);
      if (!managed || !managed.isReady) continue;

      const clipLocalTime = currentTime - clip.startTime + clip.inPoint;
      const elementTime = clipLocalTime / 1000;
      this.seekElement(managed, elementTime);
    }
  }

  // ============================================================================
  // Internal - Element Management
  // ============================================================================

  private createElement(type: 'video' | 'audio', src: string): HTMLVideoElement | HTMLAudioElement {
    if (type === 'video') {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = false; // Unmuted by default, volume controlled by masterVolume
      video.playsInline = true;
      video.src = src;

      // Attach to container if provided (hidden, for decode)
      if (this.videoContainer) {
        video.style.position = 'absolute';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        this.videoContainer.appendChild(video);
      }

      return video;
    } else {
      const audio = document.createElement('audio');
      audio.preload = 'auto';
      audio.src = src;
      return audio;
    }
  }

  private seekElement(managed: ManagedMedia, timeSeconds: number): void {
    this.seekingClips.add(managed.clipId);
    managed.element.currentTime = timeSeconds;

    const onSeeked = () => {
      this.seekingClips.delete(managed.clipId);
      managed.element.removeEventListener('seeked', onSeeked);
    };
    managed.element.addEventListener('seeked', onSeeked);

    // Safety timeout: clear seeking flag after 500ms
    setTimeout(() => {
      this.seekingClips.delete(managed.clipId);
    }, 500);
  }

  private applyVolume(managed: ManagedMedia): void {
    let clipVolume = 1.0;
    // Get clip-level volume if available
    const clip = this.timeline.getClip(managed.clipId);
    if (clip && (clip.type === 'video' || clip.type === 'audio')) {
      clipVolume = (clip as VideoClip | AudioClip).volume ?? 1.0;
    }
    managed.element.volume = this.masterVolume * clipVolume;
  }
}
