import { useSyncExternalStore, useCallback, useRef, useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useVideoTimeline, MAIN_VIDEO_TRACK_ID } from './VideoTimelineContext';
import { canDeleteTrack, clampMainVideoStart, clampMainVideoDuration } from './timelineRules';
import { TRACK_PRIORITY, TRACK_TYPE_HEIGHT } from './trackOrder';
import type { TrackLayout } from '../../../components/TimelinePanel/interactions';
import {
  setupTimelineKeyboardShortcuts,
  splitClipAtPlayhead,
} from '../../../components/TimelinePanel/interactions';
import TimeRuler from '../../../components/TimelinePanel/TimeRuler';
import Playhead from '../../../components/TimelinePanel/Playhead';
import TrackRow from '../../../components/TimelinePanel/TrackRow';
import TrackLabels from '../../../components/TimelinePanel/TrackLabels';
import ContextMenu, {
  useContextMenu,
  type MenuItem,
} from '../../../components/TimelinePanel/ContextMenu';
import type { Track } from '../../../engine/timeline/types';

// ============================================================================
// VideoTimelinePanel - /video 页底部多轨时间线
// 与 / 页的 TimelinePanel 完全独立，只读取 useVideoTimeline() 注入的 store
// 渲染顺序按 TRACK_PRIORITY（特效/贴纸/字幕/画中画/主视频/音频）
// 每条 TrackRow 外层包 useDroppable，承接左侧素材库拖拽
// ============================================================================

const MIN_HEIGHT = 160;
const MAX_HEIGHT = 460;
const DEFAULT_HEIGHT = 260;
const TRACK_LABELS_WIDTH = 160;
const RULER_HEIGHT = 28;
const CONTROLS_HEIGHT = 36;

export default function VideoTimelinePanel() {
  const { timeline, timelineStore } = useVideoTimeline();
  const snapshot = useSyncExternalStore(timelineStore.subscribe, () => timelineStore.getSnapshot());
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(DEFAULT_HEIGHT);
  const resizingRef = useRef(false);

  // 视口宽度
  useEffect(() => {
    const container = tracksScrollRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        timelineStore.setViewportWidthPx(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [timelineStore]);

  // 键盘快捷键
  useEffect(() => {
    const cleanup = setupTimelineKeyboardShortcuts({
      getSelectedClipId: () => timelineStore.getSnapshot().selectedClipId,
      timeline,
      timelineStore,
    });
    return cleanup;
  }, [timeline, timelineStore]);

  // 主轨约束：在 timeline notify 后纠正主视频轨 clip 位置/时长（幂等）
  useEffect(() => {
    const correct = () => {
      const main = timeline.getTrack(MAIN_VIDEO_TRACK_ID);
      if (!main) return;
      for (const c of main.clips) {
        const fixedStart = clampMainVideoStart(main, c.id, c.startTime, c.duration);
        const fixedDuration = clampMainVideoDuration(main, c.id, fixedStart, c.duration);
        if (fixedStart !== c.startTime || fixedDuration !== c.duration) {
          timeline.resizeClip(c.id, fixedStart, fixedDuration);
        }
      }
    };
    const unsubscribe = timeline.subscribe(correct);
    correct();
    return unsubscribe;
  }, [timeline]);

  // 高度拖拽
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    const startY = e.clientY;
    const startHeight = heightRef.current;
    const onMove = (ev: PointerEvent) => {
      if (!resizingRef.current) return;
      const delta = startY - ev.clientY;
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, startHeight + delta));
      heightRef.current = newHeight;
      if (panelRef.current) panelRef.current.style.height = `${newHeight}px`;
    };
    const onUp = () => {
      resizingRef.current = false;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  // 横向滚动
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = e.currentTarget.scrollLeft;
      timelineStore.setScrollLeft(scrollLeft / snapshot.zoom);
    },
    [timelineStore, snapshot.zoom],
  );

  // Ctrl+Wheel 缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = tracksScrollRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseTime = snapshot.scrollLeft + mouseX / snapshot.zoom;
        const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
        timelineStore.zoomAt(mouseTime, factor);
      }
    },
    [timelineStore, snapshot.scrollLeft, snapshot.zoom],
  );

  const formatTime = (ms: number): string => {
    const total = ms / 1000;
    const minutes = Math.floor(total / 60);
    const seconds = Math.floor(total % 60);
    const millis = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  };

  // 右键菜单
  const { menu, show: showContextMenu, hide: hideContextMenu } = useContextMenu();

  const handleClipContextMenu = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.preventDefault();
      const clip = timeline.getClip(clipId);
      if (!clip) return;
      const items: MenuItem[] = [
        { id: 'split', label: '在播放头分割', icon: '✂', shortcut: 'S' },
        { id: 'duplicate', label: '复制', icon: '📋', shortcut: 'Ctrl+D' },
        { id: 'sep1', label: '', separator: true },
        { id: 'delete', label: '删除', icon: '🗑', shortcut: 'Del', danger: true },
      ];
      showContextMenu(e.clientX, e.clientY, items, (actionId) => {
        switch (actionId) {
          case 'split':
            splitClipAtPlayhead(clipId, timeline, timelineStore);
            break;
          case 'duplicate': {
            const c = timeline.getClip(clipId);
            if (c) {
              const newClip = {
                ...c,
                id: `${c.id}-dup-${Date.now()}`,
                startTime: c.endTime,
                endTime: c.endTime + c.duration,
              };
              timeline.addClip(c.trackId, newClip);
            }
            break;
          }
          case 'delete':
            timeline.removeClip(clipId);
            timelineStore.selectClip(null);
            break;
        }
      });
    },
    [timeline, timelineStore, showContextMenu],
  );

  const handleTrackContextMenu = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      e.preventDefault();
      const track = timeline.getTrack(trackId);
      if (!track) return;
      const deletable = canDeleteTrack(track);
      const items: MenuItem[] = [
        { id: 'rename', label: '重命名轨道', icon: '✏' },
        {
          id: 'toggle_lock',
          label: track.locked ? '解锁' : '锁定',
          icon: track.locked ? '🔓' : '🔒',
        },
        {
          id: 'toggle_visible',
          label: track.visible ? '隐藏' : '显示',
          icon: track.visible ? '👁‍🗨' : '👁',
        },
        { id: 'sep1', label: '', separator: true },
        { id: 'clear_track', label: '清空轨道', icon: '🧹' },
        {
          id: 'delete_track',
          label: deletable ? '删除轨道' : '主视频轨不可删除',
          icon: '🗑',
          danger: true,
          disabled: !deletable,
        },
      ];
      showContextMenu(e.clientX, e.clientY, items, (actionId) => {
        switch (actionId) {
          case 'toggle_lock':
            timeline.updateTrack(trackId, { locked: !track.locked });
            break;
          case 'toggle_visible':
            timeline.updateTrack(trackId, { visible: !track.visible });
            break;
          case 'clear_track': {
            const t = timeline.getTrack(trackId);
            if (t) {
              for (const c of [...t.clips]) timeline.removeClip(c.id);
            }
            break;
          }
          case 'delete_track':
            if (deletable) {
              timeline.removeTrack(trackId);
              timelineStore.selectTrack(null);
            }
            break;
        }
      });
    },
    [timeline, timelineStore, showContextMenu],
  );

  // tracks 排序：按 TRACK_PRIORITY 主分类 + order 次分类
  // 注意：snapshot 每次 emit 后引用变化，但 snapshot.project 是同一引用，
  // 所以必须用 snapshot（或 snapshot.project.tracks.length + duration）做 dep。
  const tracks: Track[] = useMemo(() => {
    return snapshot.project.tracks.slice().sort((a: Track, b: Track) => {
      const pa = TRACK_PRIORITY[a.type] ?? 50;
      const pb = TRACK_PRIORITY[b.type] ?? 50;
      if (pa !== pb) return pa - pb;
      return a.order - b.order;
    });
  }, [snapshot]);

  const totalWidthPx = snapshot.duration * snapshot.zoom;

  // 计算每条轨道布局，给 ClipBlock 跨轨拖拽 hit-test 用
  const trackLayouts = useMemo<TrackLayout[]>(() => {
    const layouts: TrackLayout[] = [];
    let top = 0;
    for (const track of tracks) {
      const height = TRACK_TYPE_HEIGHT[track.type] ?? 48;
      layouts.push({ trackId: track.id, top, height });
      top += height;
    }
    return layouts;
  }, [tracks]);

  return (
    <div
      ref={panelRef}
      className="flex flex-col border-t border-gray-800 bg-gray-900 select-none"
      style={{ height: DEFAULT_HEIGHT, minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
    >
      {/* 上边沿拖动 */}
      <div
        className="h-1.5 cursor-row-resize bg-gray-800 hover:bg-blue-500 transition-colors flex-shrink-0"
        onPointerDown={handleResizeStart}
      />

      {/* 控制条 */}
      <div
        className="flex items-center gap-3 px-3 border-b border-gray-800 bg-gray-900 flex-shrink-0"
        style={{ height: CONTROLS_HEIGHT }}
      >
        <button
          type="button"
          onClick={() => timelineStore.togglePlay()}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white text-xs cursor-pointer border-none"
        >
          {snapshot.isPlaying ? '⏸' : '▶'}
        </button>
        <span className="text-xs text-gray-300 font-mono">
          {formatTime(snapshot.currentTime)} / {formatTime(snapshot.duration)}
        </span>
        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-gray-400">
          缩放
          <input
            type="range"
            min={1}
            max={100}
            value={Math.round(snapshot.zoom * 100)}
            onChange={(e) => timelineStore.setZoom(Number(e.target.value) / 100)}
            className="w-24 h-1"
          />
        </label>
      </div>

      {/* 主体 */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* 左：轨道标签 */}
        <div
          className="flex flex-col border-r border-gray-800 bg-gray-900 flex-shrink-0 overflow-hidden"
          style={{ width: TRACK_LABELS_WIDTH }}
        >
          <div style={{ height: RULER_HEIGHT }} className="border-b border-gray-800" />
          <TrackLabels
            tracks={tracks}
            selectedTrackId={snapshot.selectedTrackId}
            onSelectTrack={(id) => timelineStore.selectTrack(id)}
            timeline={timeline}
            canReorder={(t) => canDeleteTrack(t)}
          />
        </div>

        {/* 右：滚动区 + 轨道行 */}
        <div
          ref={tracksScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          <div
            style={{ width: Math.max(totalWidthPx, 100), minHeight: '100%', position: 'relative' }}
          >
            <TimeRuler
              zoom={snapshot.zoom}
              scrollLeft={snapshot.scrollLeft}
              duration={snapshot.duration}
              height={RULER_HEIGHT}
              onSeek={(time) => timelineStore.seek(time)}
            />

            <div style={{ paddingTop: RULER_HEIGHT }}>
              {/* 顶部拖入空白：自动新建对应类型轨 */}
              <DropGap kind="top" />

              {tracks.map((track) => (
                <DropTrackRow key={track.id} trackId={track.id} trackType={track.type}>
                  <TrackRow
                    track={track}
                    zoom={snapshot.zoom}
                    scrollLeft={snapshot.scrollLeft}
                    selectedClipId={snapshot.selectedClipId}
                    onSelectClip={(id) => timelineStore.selectClip(id)}
                    timeline={timeline}
                    timelineStore={timelineStore}
                    trackLayouts={trackLayouts}
                    onClipContextMenu={handleClipContextMenu}
                    onTrackContextMenu={handleTrackContextMenu}
                  />
                </DropTrackRow>
              ))}

              {/* 底部拖入空白 */}
              <DropGap kind="bottom" />
            </div>

            <Playhead
              currentTime={snapshot.currentTime}
              zoom={snapshot.zoom}
              scrollLeft={snapshot.scrollLeft}
              height={RULER_HEIGHT + trackLayouts.reduce((s, l) => s + l.height, 0) + 24}
              onSeek={(time) => timelineStore.seek(time)}
            />
          </div>
        </div>
      </div>

      <ContextMenu state={menu} onClose={hideContextMenu} />
    </div>
  );
}

// ============================================================================
// 子组件：包裹 TrackRow 的 droppable
// ============================================================================

function DropTrackRow({
  trackId,
  trackType,
  children,
}: {
  trackId: string;
  trackType: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-track-${trackId}`,
    data: { kind: 'track', trackId, trackType },
  });
  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'ring-1 ring-inset ring-blue-400' : ''}
      data-drop-track={trackId}
    >
      {children}
    </div>
  );
}

function DropGap({ kind }: { kind: 'top' | 'bottom' }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-gap-${kind}`,
    data: { kind: 'gap', position: kind },
  });
  return (
    <div
      ref={setNodeRef}
      className={`h-2 ${isOver ? 'bg-blue-500/40' : 'bg-transparent'} transition-colors`}
    />
  );
}
