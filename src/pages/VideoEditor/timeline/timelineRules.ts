import type { Timeline } from '../../../engine/timeline/index';
import type {
  Clip,
  Track,
  TrackType,
  VideoClip,
  AudioClip,
  TextClip,
  StickerClip,
  EffectClip,
} from '../../../engine/timeline/types';
import { MAIN_VIDEO_TRACK_ID } from './VideoTimelineContext';
import { TRACK_TYPE_LABELS } from './trackOrder';

// ============================================================================
// timelineRules - /video 页剪映式时间线纯函数业务规则
// 主轨拼接独占 / 画中画自由叠加 / 字幕贴纸特效自由叠加 / 音频混音
// 拖入空白处自动新建对应类型轨道
// ============================================================================

let _trackUid = 0;
function newTrackId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_trackUid}`;
}

let _clipUid = 0;
function newClipId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++_clipUid}`;
}

// === 取主视频轨 ===

export function getMainVideoTrack(timeline: Timeline): Track | undefined {
  const direct = timeline.getTrack(MAIN_VIDEO_TRACK_ID);
  if (direct) return direct;
  return timeline.getTracks().find((t) => t.type === 'video');
}

// === 主轨保护（不可删除）===

export function canDeleteTrack(track: Track): boolean {
  return track.id !== MAIN_VIDEO_TRACK_ID && track.type !== 'video';
}

// === 创建轨道 ===

function nextOrder(timeline: Timeline): number {
  const tracks = timeline.getTracks();
  if (tracks.length === 0) return 0;
  return Math.max(...tracks.map((t) => t.order)) + 1;
}

/** 同类轨道中最小 order - 1，使新建轨道排在同类最上方 */
function nextOrderOnTop(timeline: Timeline, type: TrackType): number {
  const sameType = timeline.getTracks().filter((t) => t.type === type);
  if (sameType.length === 0) return nextOrder(timeline);
  return Math.min(...sameType.map((t) => t.order)) - 1;
}

export function createTrackOfType(timeline: Timeline, type: TrackType): Track {
  const track: Track = {
    id: newTrackId(`track-${type}`),
    type,
    name: TRACK_TYPE_LABELS[type] ?? type,
    clips: [],
    locked: false,
    visible: true,
    order: nextOrderOnTop(timeline, type),
  };
  timeline.addTrack(track);
  return track;
}

// === 主视频：拼接（首尾相连，禁止重叠） ===

/**
 * 计算主视频轨内可放置的合法 startTime：
 * - 默认拼接到末尾；
 * - 若 desiredStart 落在已有 clip 上则推到该 clip 末尾；
 * - 否则取 desiredStart（已被前后 clip 夹住的间隙也允许）。
 */
export function computeMainVideoSnapStart(
  track: Track,
  duration: number,
  desiredStart: number,
  ignoreClipId?: string,
): number {
  const clips = track.clips
    .filter((c) => c.id !== ignoreClipId)
    .slice()
    .sort((a, b) => a.startTime - b.startTime);

  // 拍尾：默认贴在末尾
  const tailEnd = clips.length > 0 ? clips[clips.length - 1].endTime : 0;
  let start = Math.max(0, desiredStart);

  // 落在某 clip 内 → 推到其末尾
  for (const c of clips) {
    if (start >= c.startTime && start < c.endTime) {
      start = c.endTime;
    }
  }

  // 区间冲突检测：尝试把 [start, start+duration] 推到不重叠位置
  let end = start + duration;
  for (const c of clips) {
    if (start < c.endTime && end > c.startTime) {
      // 有重叠 → 推到该 clip 之后
      start = c.endTime;
      end = start + duration;
    }
  }

  // 若推到末尾仍冲突（不应发生），保险地拼到 tailEnd
  if (start < tailEnd && start + duration > tailEnd) {
    start = tailEnd;
  }
  return start;
}

// === 通用：在指定轨道上自由放置（允许重叠） ===

function placeFreeOnTrack(
  timeline: Timeline,
  trackId: string,
  clip: Clip,
  startTime: number,
): Clip {
  clip.startTime = Math.max(0, startTime);
  clip.endTime = clip.startTime + clip.duration;
  timeline.addClip(trackId, clip);
  return clip;
}

// === 路由分发 ===

export interface PlaceContext {
  timeline: Timeline;
  /** 落点时间（ms），由像素位置反算 */
  dropTime: number;
  /** 鼠标悬停命中的轨道 id；未命中则为空（自动新建） */
  hoverTrackId?: string;
  /** 鼠标悬停命中的轨道类型；未命中则为空 */
  hoverTrackType?: TrackType;
}

/**
 * 视频/图片素材投放：
 * - 命中主视频轨：拼接 + 不重叠；
 * - 命中 pip 轨：自由叠加；
 * - 其他/未命中：自动新建 pip 轨。
 */
export function placeVideoOrImage(ctx: PlaceContext, clip: VideoClip): Clip | null {
  const { timeline, dropTime, hoverTrackId, hoverTrackType } = ctx;

  if (hoverTrackType === 'video') {
    const track = hoverTrackId ? timeline.getTrack(hoverTrackId) : getMainVideoTrack(timeline);
    if (!track) return null;
    const start = computeMainVideoSnapStart(track, clip.duration, dropTime);
    return placeFreeOnTrack(timeline, track.id, clip, start);
  }

  if (hoverTrackType === 'pip' && hoverTrackId) {
    return placeFreeOnTrack(timeline, hoverTrackId, clip, dropTime);
  }

  // 默认：自动新建 pip 轨
  const newTrack = createTrackOfType(timeline, 'pip');
  return placeFreeOnTrack(timeline, newTrack.id, clip, dropTime);
}

/**
 * 音频投放：始终归入音频区，可任意重叠。
 * - 命中音频轨 → 投到该轨；
 * - 否则新建音频轨（允许多条音频轨并存 = 混音）。
 */
export function placeAudio(ctx: PlaceContext, clip: AudioClip): Clip | null {
  const { timeline, dropTime, hoverTrackId, hoverTrackType } = ctx;
  if (hoverTrackType === 'audio' && hoverTrackId) {
    return placeFreeOnTrack(timeline, hoverTrackId, clip, dropTime);
  }
  // 拖到空白 → 新建音频轨
  const newTrack = createTrackOfType(timeline, 'audio');
  return placeFreeOnTrack(timeline, newTrack.id, clip, dropTime);
}

/** 字幕：text clip → subtitle 轨 */
export function placeText(ctx: PlaceContext, clip: TextClip): Clip | null {
  const { timeline, dropTime, hoverTrackId, hoverTrackType } = ctx;
  // 拖到已有字幕轨 → 自由叠加
  if (hoverTrackType === 'subtitle' && hoverTrackId) {
    return placeFreeOnTrack(timeline, hoverTrackId, clip, dropTime);
  }
  // 拖到空白 / gap → 总是新建字幕轨（允许多条字幕轨并存）
  const newTrack = createTrackOfType(timeline, 'subtitle');
  return placeFreeOnTrack(timeline, newTrack.id, clip, dropTime);
}

/** 贴纸 */
export function placeSticker(ctx: PlaceContext, clip: StickerClip): Clip | null {
  const { timeline, dropTime, hoverTrackId, hoverTrackType } = ctx;
  if (hoverTrackType === 'sticker' && hoverTrackId) {
    return placeFreeOnTrack(timeline, hoverTrackId, clip, dropTime);
  }
  // 拖到空白 → 新建贴纸轨
  const newTrack = createTrackOfType(timeline, 'sticker');
  return placeFreeOnTrack(timeline, newTrack.id, clip, dropTime);
}

/** 特效 */
export function placeEffect(ctx: PlaceContext, clip: EffectClip): Clip | null {
  const { timeline, dropTime, hoverTrackId, hoverTrackType } = ctx;
  if (hoverTrackType === 'effect' && hoverTrackId) {
    return placeFreeOnTrack(timeline, hoverTrackId, clip, dropTime);
  }
  // 拖到空白 → 新建特效轨
  const newTrack = createTrackOfType(timeline, 'effect');
  return placeFreeOnTrack(timeline, newTrack.id, clip, dropTime);
}

// === 主轨 move/resize 约束（用于现有 ClipBlock 拖动后纠正） ===

/**
 * 校验主轨内 [start, start+duration] 是否与其他 clip 重叠；
 * 重叠则返回最近合法 startTime（贴到前后 clip 边缘）。
 */
export function clampMainVideoStart(
  track: Track,
  movedClipId: string,
  desiredStart: number,
  duration: number,
): number {
  const others = track.clips
    .filter((c) => c.id !== movedClipId)
    .sort((a, b) => a.startTime - b.startTime);

  let start = Math.max(0, desiredStart);
  let end = start + duration;

  // 找到与之重叠的 clip
  for (const c of others) {
    if (start < c.endTime && end > c.startTime) {
      // 选择推到 c 之前还是之后：哪个偏移更小
      const moveBefore = c.startTime - duration;
      const moveAfter = c.endTime;
      const distBefore = moveBefore >= 0 ? Math.abs(start - moveBefore) : Infinity;
      const distAfter = Math.abs(start - moveAfter);
      start = distBefore <= distAfter ? Math.max(0, moveBefore) : moveAfter;
      end = start + duration;
    }
  }
  return start;
}

/**
 * 主轨 resize 时 right edge 不允许越过下一段 startTime。
 * 返回夹紧后的 duration。
 */
export function clampMainVideoDuration(
  track: Track,
  clipId: string,
  startTime: number,
  desiredDuration: number,
): number {
  const next = track.clips
    .filter((c) => c.id !== clipId && c.startTime > startTime)
    .sort((a, b) => a.startTime - b.startTime)[0];
  const maxEnd = next ? next.startTime : Number.POSITIVE_INFINITY;
  const allowedDuration = Math.max(100, maxEnd - startTime);
  return Math.min(Math.max(100, desiredDuration), allowedDuration);
}

// === id helper 暴露 ===
export { newClipId };
