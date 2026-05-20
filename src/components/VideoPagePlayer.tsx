import { useCallback, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Engine } from '../engine';
import { UpdatePageVideoCommand } from '../engine';
import type { Page } from '../types';

interface VideoPagePlayerProps {
  engine: Engine;
  page: Page;
  /** 画布缩放（视频页本身按 1:1 渲染，但容器尺寸用 scale 后的尺寸来撑满） */
  scale: number;
  width: number;
  height: number;
}

/** 拖动 timeline 时的同步阈值（秒），小于该值不回灌避免抖动 */
const SYNC_THRESHOLD_SEC = 0.15;

/**
 * 视频页播放器：以视频为主时钟驱动 engine.timeline。
 * - video.timeupdate / play / pause -> 写入 engine.timeline
 * - engine.timeline 反向变化（外部 seek/play/pause）-> 回灌到 video
 */
export default function VideoPagePlayer({
  engine,
  page,
  scale,
  width,
  height,
}: VideoPagePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  /** 标记本次 video.currentTime 改动来源于 timeline，避免事件回灌死循环 */
  const seekingFromTimelineRef = useRef(false);
  const videoCfg = page.video;
  const src = videoCfg?.src ?? '';

  // ============================================================================
  // video -> timeline （视频权威）
  // ============================================================================
  const handleTimeUpdate = useCallback(() => {
    if (seekingFromTimelineRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    engine.timeline.seek(v.currentTime * 1000);
  }, [engine]);

  const handlePlay = useCallback(() => {
    engine.timeline.play();
  }, [engine]);

  const handlePause = useCallback(() => {
    engine.timeline.pause();
  }, [engine]);

  const handleSeeked = useCallback(() => {
    if (seekingFromTimelineRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    engine.timeline.seek(v.currentTime * 1000);
  }, [engine]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration)) return;
    // 同步 timeline 总时长，避免默认 5s 屏障导致视频被强制暂停
    engine.timeline.setDuration(v.duration * 1000);
    // duration 与已存值差异较大时才写入，避免无意义历史记录
    const prev = page.video?.duration;
    if (prev === undefined || Math.abs(prev - v.duration) > 0.05) {
      engine.execute(new UpdatePageVideoCommand(engine.scene, page.id, { duration: v.duration }));
    }
  }, [engine, page.id, page.video?.duration]);

  // ============================================================================
  // 切换页/src 时如果 page.video.duration 已知，预先同步 timeline.duration
  // ============================================================================
  useEffect(() => {
    if (videoCfg?.duration && Number.isFinite(videoCfg.duration)) {
      engine.timeline.setDuration(videoCfg.duration * 1000);
    }
  }, [engine, videoCfg?.duration, src]);

  // ============================================================================
  // timeline -> video （编辑器外部 seek 时回灌）
  //
  // 采用「视频驱动」模式，play/pause 入口在视频原生控件上，
  // 这里仅处理外部主动 seek timeline 的场景，不反向干预视频的播放状态，
  // 避免由于事件顺序造成点不住暂停。
  // ============================================================================
  useEffect(() => {
    const unsub = engine.timeline.subscribe(() => {
      const v = videoRef.current;
      if (!v) return;
      // 视频自身在播时，是它驱动的 timeline，不需要反向同步
      if (!v.paused) return;
      const tSec = engine.timeline.getCurrentTime() / 1000;
      if (Math.abs(v.currentTime - tSec) > SYNC_THRESHOLD_SEC) {
        seekingFromTimelineRef.current = true;
        try {
          v.currentTime = tSec;
        } catch {
          /* readyState 不足时忽略 */
        }
        const clear = (): void => {
          seekingFromTimelineRef.current = false;
          v.removeEventListener('seeked', clear);
        };
        v.addEventListener('seeked', clear, { once: true });
      }
    });
    return () => {
      unsub();
    };
  }, [engine]);

  // ============================================================================
  // 上传交互（无 src 时显示）
  // ============================================================================
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      engine.execute(
        new UpdatePageVideoCommand(engine.scene, page.id, {
          src: url,
          duration: undefined,
        }),
      );
    },
    [engine, page.id],
  );

  const handleUrlSubmit = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed) return;
      engine.execute(
        new UpdatePageVideoCommand(engine.scene, page.id, {
          src: trimmed,
          duration: undefined,
        }),
      );
    },
    [engine, page.id],
  );

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div
      className="relative shrink-0 bg-black"
      style={{
        width: width * scale,
        height: height * scale,
      }}
    >
      <div
        className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {src ? (
          <video
            ref={videoRef}
            key={src}
            src={src}
            autoPlay={videoCfg?.autoplay}
            muted={videoCfg?.muted}
            loop={videoCfg?.loop}
            controls
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeeked={handleSeeked}
            onLoadedMetadata={handleLoadedMetadata}
            className="max-w-full max-h-full"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <UploadArea onPickFile={handleFileChange} onSubmitUrl={handleUrlSubmit} />
        )}
      </div>
    </div>
  );
}

function UploadArea({
  onPickFile,
  onSubmitUrl,
}: {
  onPickFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmitUrl: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-4 text-white">
      <div className="text-4xl opacity-70">🎬</div>
      <div className="text-sm opacity-80">该页面尚未配置视频</div>
      <div className="flex flex-col gap-2 items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer border-none"
        >
          选择本地视频文件
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={onPickFile}
          style={{ display: 'none' }}
        />

        <div className="flex items-center gap-1 mt-2">
          <input
            ref={urlRef}
            type="text"
            placeholder="或粘贴视频 URL"
            className="px-2 py-1 text-xs rounded border border-gray-600 bg-gray-800 text-white w-[200px]"
          />
          <button
            type="button"
            onClick={() => onSubmitUrl(urlRef.current?.value ?? '')}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded cursor-pointer border-none"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
