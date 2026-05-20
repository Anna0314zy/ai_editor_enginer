import type { TrackType } from '../../../engine/timeline/types';

// ============================================================================
// Track Layering Rules（剪映式六分类）
// 视觉从上到下，数值越小越靠上、画面越优先。
// 音频固定全局最底层，仅发声、不参与画面层级。
// ============================================================================

export const TRACK_PRIORITY: Record<TrackType, number> = {
  effect: 0,
  sticker: 1,
  subtitle: 2,
  pip: 3,
  video: 4,
  overlay: 4, // 兼容旧值
  audio: 99,
};

/** 中文标签 */
export const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  effect: '特效',
  sticker: '贴纸',
  subtitle: '字幕',
  pip: '画中画',
  video: '主视频',
  overlay: '覆盖',
  audio: '音频',
};

/** 行高（px） */
export const TRACK_TYPE_HEIGHT: Record<TrackType, number> = {
  effect: 36,
  sticker: 36,
  subtitle: 36,
  pip: 48,
  video: 60,
  overlay: 48,
  audio: 40,
};

/** 把 clip 的种类映射到对应 TrackType */
export function mapClipKindToTrackType(
  kind: 'media-video' | 'media-audio' | 'media-image' | 'text' | 'sticker' | 'effect',
  isMainVideo = false,
): TrackType {
  switch (kind) {
    case 'media-video':
    case 'media-image':
      return isMainVideo ? 'video' : 'pip';
    case 'media-audio':
      return 'audio';
    case 'text':
      return 'subtitle';
    case 'sticker':
      return 'sticker';
    case 'effect':
      return 'effect';
  }
}
