import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';
import type {
  VideoClip,
  AudioClip,
  TextClip,
  StickerClip,
  ShapeClip,
} from '../../../engine/timeline/types';
import PreviewControls from './PreviewControls';

// ============================================================================
// PreviewStage - 16:9 预览舞台
// 视频/音频层：按当前时间播放命中的 clip（首版仅支持单视频 + 单音频）
// Overlay 层：渲染 text/sticker/shape clip
// 与 useVideoTimeline 注入的 timelineStore 双向联动
// ============================================================================

interface ActiveClips {
  video?: VideoClip;
  audio?: AudioClip;
  overlays: (TextClip | StickerClip | ShapeClip)[];
}

const SYNC_TOLERANCE = 0.15; // s

export default function PreviewStage() {
  const { timelineStore, resourceManager } = useVideoTimeline();
  const snapshot = useSyncExternalStore(timelineStore.subscribe, () => timelineStore.getSnapshot());
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // 1. 计算当前时间命中的 clip
  const active: ActiveClips = useMemo(() => {
    const result: ActiveClips = { overlays: [] };
    const tracks = snapshot.project.tracks;
    const t = snapshot.currentTime;
    for (const track of tracks) {
      if (!track.visible) continue;
      for (const clip of track.clips) {
        if (clip.startTime <= t && clip.endTime > t) {
          if (clip.type === 'video' && !result.video) {
            result.video = clip as VideoClip;
          } else if (clip.type === 'audio' && !result.audio) {
            result.audio = clip as AudioClip;
          } else if (clip.type === 'text' || clip.type === 'sticker' || clip.type === 'shape') {
            result.overlays.push(clip as TextClip | StickerClip | ShapeClip);
          }
        }
      }
    }
    return result;
  }, [snapshot.project, snapshot.currentTime]);

  // 2. 同步 <video>
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const clip = active.video;
    if (!clip) {
      if (!el.paused) el.pause();
      if (el.src) el.removeAttribute('src');
      return;
    }
    const src = clip.resourceId ? (resourceManager.getSrc(clip.resourceId) ?? '') : '';
    if (!src) return;
    if (el.src !== src) el.src = src;
    el.volume = clip.volume ?? 1;
    el.playbackRate = clip.speed ?? 1;
    const targetSec = (snapshot.currentTime - clip.startTime + clip.inPoint) / 1000;
    if (Math.abs(el.currentTime - targetSec) > SYNC_TOLERANCE) {
      try {
        el.currentTime = Math.max(0, targetSec);
      } catch {
        /* 忽略 seeking 错误 */
      }
    }
  }, [active.video, snapshot.currentTime, resourceManager]);

  // 3. 同步 <audio>
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const clip = active.audio;
    if (!clip) {
      if (!el.paused) el.pause();
      if (el.src) el.removeAttribute('src');
      return;
    }
    const src = clip.resourceId ? (resourceManager.getSrc(clip.resourceId) ?? '') : '';
    if (!src) return;
    if (el.src !== src) el.src = src;
    el.volume = clip.volume ?? 1;
    const targetSec = (snapshot.currentTime - clip.startTime + clip.inPoint) / 1000;
    if (Math.abs(el.currentTime - targetSec) > SYNC_TOLERANCE) {
      try {
        el.currentTime = Math.max(0, targetSec);
      } catch {
        /* 忽略 seeking 错误 */
      }
    }
  }, [active.audio, snapshot.currentTime, resourceManager]);

  // 4. 同步播放/暂停
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (snapshot.isPlaying) {
      if (v && active.video && v.paused) v.play().catch(() => undefined);
      if (a && active.audio && a.paused) a.play().catch(() => undefined);
    } else {
      if (v && !v.paused) v.pause();
      if (a && !a.paused) a.pause();
    }
  }, [snapshot.isPlaying, active.video, active.audio]);

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 gap-3">
      <div className="relative w-full max-w-5xl aspect-video bg-black rounded shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          playsInline
          muted={false}
        />
        {!active.video && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm pointer-events-none">
            无视频内容
          </div>
        )}
        <audio ref={audioRef} className="hidden" />
        <div className="absolute inset-0 pointer-events-none">
          {active.overlays.map((clip) => (
            <OverlayRenderer key={clip.id} clip={clip} />
          ))}
        </div>
      </div>
      <PreviewControls />
    </div>
  );
}

// ============================================================================
// Overlay 渲染：text / sticker / shape
// ============================================================================

function OverlayRenderer({ clip }: { clip: TextClip | StickerClip | ShapeClip }) {
  if (clip.type === 'text') {
    const c = clip as TextClip;
    return (
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 select-none"
        style={{
          fontSize: c.style.fontSize,
          fontFamily: c.style.fontFamily,
          color: c.style.color,
          textAlign: c.style.align,
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
        }}
      >
        {c.content}
      </div>
    );
  }
  if (clip.type === 'sticker') {
    return (
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl select-none"
        title={clip.name}
      >
        {extractEmoji(clip.name) || '⭐'}
      </div>
    );
  }
  const s = clip as ShapeClip;
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded"
      style={{ backgroundColor: s.fill || '#3b82f6' }}
    />
  );
}

function extractEmoji(name: string): string | null {
  for (let i = name.length - 1; i >= 0; i--) {
    const code = name.charCodeAt(i);
    if (code > 127) return name.slice(i);
  }
  return null;
}
