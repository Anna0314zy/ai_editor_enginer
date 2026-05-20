import type { Timeline } from '../../engine/timeline/index';
import type { ResourceManager } from '../../media/resourceManager';
import type {
  Clip,
  ClipType,
  VideoClip,
  AudioClip,
  TextClip,
  StickerClip,
  Track,
  TrackType,
} from '../../engine/timeline/types';

// ============================================================================
// Clip Factory - Creates properly typed clips for the Timeline
// Handles auto-track creation and file import with ResourceManager.
// ============================================================================

// --- ID Generator ---
let _idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
}

// --- Options ---

export interface CreateClipOptions {
  startTime: number; // Typically = playhead currentTime
  duration?: number; // Default varies by type
  name?: string;
  resourceId?: string;
  content?: string; // For text clips
  trackId?: string; // Will be set later by addClip
}

// --- Default durations (ms) ---
const DEFAULT_DURATION_VIDEO = 5000;
const DEFAULT_DURATION_AUDIO = 5000;
const DEFAULT_DURATION_TEXT = 3000;
const DEFAULT_DURATION_STICKER = 3000;

// ============================================================================
// Clip Creators
// ============================================================================

export function createVideoClip(options: CreateClipOptions): VideoClip {
  const duration = options.duration ?? DEFAULT_DURATION_VIDEO;
  return {
    id: uid('clip-video'),
    trackId: options.trackId ?? '',
    type: 'video',
    name: options.name ?? 'Video',
    startTime: options.startTime,
    duration,
    endTime: options.startTime + duration,
    inPoint: 0,
    resourceId: options.resourceId,
    volume: 1,
    speed: 1,
  };
}

export function createAudioClip(options: CreateClipOptions): AudioClip {
  const duration = options.duration ?? DEFAULT_DURATION_AUDIO;
  return {
    id: uid('clip-audio'),
    trackId: options.trackId ?? '',
    type: 'audio',
    name: options.name ?? 'Audio',
    startTime: options.startTime,
    duration,
    endTime: options.startTime + duration,
    inPoint: 0,
    resourceId: options.resourceId,
    volume: 1,
  };
}

export function createTextClip(options: CreateClipOptions): TextClip {
  const duration = options.duration ?? DEFAULT_DURATION_TEXT;
  return {
    id: uid('clip-text'),
    trackId: options.trackId ?? '',
    type: 'text',
    name: options.name ?? '文本',
    startTime: options.startTime,
    duration,
    endTime: options.startTime + duration,
    inPoint: 0,
    content: options.content ?? '默认文本',
    style: {
      fontSize: 28,
      fontFamily: 'sans-serif',
      color: '#ffffff',
      align: 'center',
    },
  };
}

export function createStickerClip(options: CreateClipOptions): StickerClip {
  const duration = options.duration ?? DEFAULT_DURATION_STICKER;
  return {
    id: uid('clip-sticker'),
    trackId: options.trackId ?? '',
    type: 'sticker',
    name: options.name ?? '贴纸',
    startTime: options.startTime,
    duration,
    endTime: options.startTime + duration,
    inPoint: 0,
    resourceId: options.resourceId,
  };
}

// ============================================================================
// Auto-Track Management
// Find an existing suitable track or create a new one.
// ============================================================================

/** Map clip type to required track type */
function getTrackTypeForClip(clipType: ClipType): TrackType {
  switch (clipType) {
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      // text, sticker, shape, effect -> overlay
      return 'overlay';
  }
}

/** Track naming counter */
const trackCounters: Record<TrackType, number> = {
  video: 0,
  audio: 0,
  overlay: 0,
  pip: 0,
  subtitle: 0,
  sticker: 0,
  effect: 0,
};

/**
 * Find the first non-locked track of matching type, or create a new one.
 * Returns the trackId.
 */
export function findOrCreateTrack(timeline: Timeline, clipType: ClipType): string {
  const requiredType = getTrackTypeForClip(clipType);
  const tracks = timeline.getTracks();

  // Find first existing matching track that is not locked
  const existing = tracks.find((t) => t.type === requiredType && !t.locked);
  if (existing) return existing.id;

  // Create new track
  trackCounters[requiredType]++;
  const trackNames: Record<TrackType, string> = {
    video: `Video ${trackCounters.video}`,
    audio: `Audio ${trackCounters.audio}`,
    overlay: `Overlay ${trackCounters.overlay}`,
    pip: `画中画 ${trackCounters.pip}`,
    subtitle: `字幕 ${trackCounters.subtitle}`,
    sticker: `贴纸 ${trackCounters.sticker}`,
    effect: `特效 ${trackCounters.effect}`,
  };

  const newTrack: Track = {
    id: uid(`track-${requiredType}`),
    type: requiredType,
    name: trackNames[requiredType],
    clips: [],
    locked: false,
    visible: true,
    order: tracks.length,
  };

  timeline.addTrack(newTrack);
  return newTrack.id;
}

// ============================================================================
// File Import - Upload media file and register with ResourceManager
// ============================================================================

export interface ImportResult {
  resourceId: string;
  duration: number; // ms
  name: string;
}

/**
 * Import a media file:
 * 1. Create Object URL
 * 2. Detect duration via HTMLMediaElement
 * 3. Register with ResourceManager
 * 4. Return resource info
 */
export async function importMediaFile(
  file: File,
  resourceManager: ResourceManager,
): Promise<ImportResult> {
  const objectUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const resourceType = isVideo ? 'video' : isAudio ? 'audio' : 'image';

  let duration = 5000; // default fallback

  // Get actual duration for video/audio
  if (isVideo || isAudio) {
    duration = await getMediaDuration(objectUrl, isVideo ? 'video' : 'audio');
  }

  const resourceId = uid('res');

  resourceManager.add({
    id: resourceId,
    type: resourceType as 'video' | 'audio' | 'image',
    src: objectUrl,
    duration,
  });

  return {
    resourceId,
    duration,
    name: file.name,
  };
}

/**
 * Get media duration by loading into a temporary HTMLMediaElement.
 */
function getMediaDuration(src: string, type: 'video' | 'audio'): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(type);
    el.preload = 'metadata';
    el.src = src;

    const onLoaded = () => {
      const durationMs = (el.duration || 5) * 1000; // Convert seconds to ms
      el.src = '';
      resolve(durationMs);
    };

    el.addEventListener('loadedmetadata', onLoaded, { once: true });
    el.addEventListener(
      'error',
      () => {
        el.src = '';
        resolve(5000); // Fallback 5s on error
      },
      { once: true },
    );
  });
}
