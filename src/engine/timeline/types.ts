// ============================================================================
// Timeline Multi-Track Type System
// Track is a container; Clip.type determines content (NLE architecture)
// ============================================================================

// === Track Types ===
// Track is a container, does not care about specific content type
// 'video' / 'audio' / 'overlay' 是旧三分类（保留以兼容 PPT 页 demo）
// 'pip' / 'subtitle' / 'sticker' / 'effect' 是 /video 页剪映式六分类中的另五类
// /video 页中：'video' 专表示主视频轨（1 条）
export type TrackType = 'video' | 'audio' | 'overlay' | 'pip' | 'subtitle' | 'sticker' | 'effect';

// === Clip Content Types ===
// Clip.type determines content; an overlay track can contain text/sticker/shape/effect
export type ClipType = 'video' | 'audio' | 'text' | 'sticker' | 'shape' | 'effect';

// === Compositing ===
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';

// === Media Resource ===
export interface MediaResource {
  id: string;
  type: 'video' | 'audio' | 'image';
  src: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// === Clip Transform ===
export interface ClipTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// === Text Clip Style ===
export interface TextClipStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

// === Base Clip ===
export interface BaseClip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  startTime: number; // Position on track (ms)
  duration: number; // Clip duration (ms)
  endTime: number; // startTime + duration (redundant, synced on mutation)
  inPoint: number; // Source material trim offset (ms)
  resourceId?: string; // Reference to MediaResource (not direct src)
}

// === Concrete Clip Types ===

export interface VideoClip extends BaseClip {
  type: 'video';
  volume: number;
  speed: number;
  transform?: ClipTransform;
}

export interface AudioClip extends BaseClip {
  type: 'audio';
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface TextClip extends BaseClip {
  type: 'text';
  content: string;
  style: TextClipStyle;
}

export interface StickerClip extends BaseClip {
  type: 'sticker';
  transform?: ClipTransform;
}

export interface ShapeClip extends BaseClip {
  type: 'shape';
  shapeType: string;
  fill: string;
  transform?: ClipTransform;
}

export interface EffectClip extends BaseClip {
  type: 'effect';
  effectType: string;
  params: Record<string, unknown>;
}

export type Clip = VideoClip | AudioClip | TextClip | StickerClip | ShapeClip | EffectClip;

// === Track ===
export interface Track {
  id: string;
  type: TrackType;
  name: string;
  clips: Clip[];
  locked: boolean;
  visible: boolean;
  order: number; // Lower = higher in UI
  // Compositing properties (for PIP, subtitle layering, transitions)
  zIndex?: number;
  opacity?: number;
  blendMode?: BlendMode;
}

// === Timeline Project ===
export interface TimelineProject {
  id: string;
  tracks: Track[];
  resources: MediaResource[];
  duration: number; // Total duration, determined by furthest clip.endTime
  fps: number;
}

// === Helper: Create clip with synced endTime ===
export function createClipTimes(
  startTime: number,
  duration: number,
): { startTime: number; duration: number; endTime: number } {
  return {
    startTime,
    duration,
    endTime: startTime + duration,
  };
}

// === Helper: Sync endTime after mutation ===
export function syncClipEndTime<T extends BaseClip>(clip: T): T {
  return { ...clip, endTime: clip.startTime + clip.duration };
}
