import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useStores, useTimelineStore } from '../../store';
import type { TrackLayout } from './interactions';
import { setupTimelineKeyboardShortcuts, splitClipAtPlayhead } from './interactions';
import TimeRuler from './TimeRuler';
import Playhead from './Playhead';
import TrackRow from './TrackRow';
import TrackLabels from './TrackLabels';
import MediaToolbar from './MediaToolbar';
import ContextMenu, { useContextMenu, type MenuItem } from './ContextMenu';

// ============================================================================
// TimelinePanel - Main container for the multi-track timeline
// Bottom panel with resizable height, time ruler, playhead, and tracks
// ============================================================================

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 400;
const DEFAULT_HEIGHT = 220;
const TRACK_LABELS_WIDTH = 160;
const RULER_HEIGHT = 28;
const CONTROLS_HEIGHT = 36;

export default function TimelinePanel() {
  const { engine, timelineStore } = useStores();
  const snapshot = useTimelineStore(timelineStore);
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(DEFAULT_HEIGHT);
  const resizingRef = useRef(false);

  // Update viewport width when container resizes
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

  // Keyboard shortcuts: Space, Delete, S, Ctrl+Z/Y, Ctrl+D
  useEffect(() => {
    const cleanup = setupTimelineKeyboardShortcuts({
      getSelectedClipId: () => timelineStore.getSnapshot().selectedClipId,
      timeline: timelineStore.getTimeline(),
      timelineStore,
      onUndo: () => {
        // TODO: integrate with timeline command history when wired up
      },
      onRedo: () => {
        // TODO: integrate with timeline command history when wired up
      },
    });
    return cleanup;
  }, [timelineStore]);

  // Resize handle drag
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
      if (panelRef.current) {
        panelRef.current.style.height = `${newHeight}px`;
      }
    };

    const onUp = () => {
      resizingRef.current = false;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  // Horizontal scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = e.currentTarget.scrollLeft;
      timelineStore.setScrollLeft(scrollLeft / snapshot.zoom);
    },
    [timelineStore, snapshot.zoom],
  );

  // Zoom with Ctrl+Wheel
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

  // Format time as MM:SS.mmm
  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const millis = Math.floor(ms % 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
  };

  // Context menu
  const { menu, show: showContextMenu, hide: hideContextMenu } = useContextMenu();

  const handleClipContextMenu = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.preventDefault();
      const timeline = timelineStore.getTimeline();
      const clip = timeline.getClip(clipId);
      if (!clip) return;

      const items: MenuItem[] = [
        { id: 'split', label: 'Split at Playhead', icon: '✂', shortcut: 'S' },
        { id: 'duplicate', label: 'Duplicate', icon: '📋', shortcut: 'Ctrl+D' },
        { id: 'sep1', label: '', separator: true },
        { id: 'delete', label: 'Delete', icon: '🗑', shortcut: 'Del', danger: true },
      ];

      showContextMenu(e.clientX, e.clientY, items, (actionId: string) => {
        switch (actionId) {
          case 'split':
            splitClipAtPlayhead(clipId, timeline, timelineStore);
            break;
          case 'duplicate': {
            const clipToDup = timeline.getClip(clipId);
            if (clipToDup) {
              const newClip = {
                ...clipToDup,
                id: `${clipToDup.id}-dup-${Date.now()}`,
                startTime: clipToDup.endTime,
                endTime: clipToDup.endTime + clipToDup.duration,
              };
              timeline.addClip(clipToDup.trackId, newClip);
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
    [timelineStore, showContextMenu],
  );

  const handleTrackContextMenu = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      e.preventDefault();
      const timeline = timelineStore.getTimeline();
      const track = timeline.getTrack(trackId);
      if (!track) return;

      const items: MenuItem[] = [
        { id: 'rename', label: 'Rename Track', icon: '✏' },
        {
          id: 'toggle_lock',
          label: track.locked ? 'Unlock' : 'Lock',
          icon: track.locked ? '🔓' : '🔒',
        },
        {
          id: 'toggle_visible',
          label: track.visible ? 'Hide' : 'Show',
          icon: track.visible ? '👁‍🗨' : '👁',
        },
        { id: 'sep1', label: '', separator: true },
        { id: 'delete_track', label: 'Delete Track', icon: '🗑', danger: true, disabled: false },
      ];

      showContextMenu(e.clientX, e.clientY, items, (actionId: string) => {
        switch (actionId) {
          case 'toggle_lock':
            timeline.updateTrack(trackId, { locked: !track.locked });
            break;
          case 'toggle_visible':
            timeline.updateTrack(trackId, { visible: !track.visible });
            break;
          case 'delete_track':
            timeline.removeTrack(trackId);
            timelineStore.selectTrack(null);
            break;
        }
      });
    },
    [timelineStore, showContextMenu],
  );

  const totalWidthPx = snapshot.duration * snapshot.zoom;
  const tracks = snapshot.project.tracks;

  // Compute track layouts for cross-track drag hit testing
  const trackLayouts = useMemo<TrackLayout[]>(() => {
    const TRACK_HEIGHTS: Record<string, number> = {
      video: 60,
      audio: 40,
      overlay: 48,
      pip: 48,
      subtitle: 36,
      sticker: 36,
      effect: 36,
    };
    const layouts: TrackLayout[] = [];
    let top = 0;
    for (const track of tracks) {
      const height = TRACK_HEIGHTS[track.type] || 48;
      layouts.push({ trackId: track.id, top, height });
      top += height;
    }
    return layouts;
  }, [tracks]);

  return (
    <div
      ref={panelRef}
      className="flex flex-col border-t border-gray-300 bg-gray-900 select-none"
      style={{ height: DEFAULT_HEIGHT, minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
    >
      {/* Resize handle */}
      <div
        className="h-1.5 cursor-row-resize bg-gray-700 hover:bg-blue-500 transition-colors flex-shrink-0"
        onPointerDown={handleResizeStart}
      />

      {/* Controls bar */}
      <div
        className="flex items-center gap-3 px-3 border-b border-gray-700 bg-gray-800 flex-shrink-0"
        style={{ height: CONTROLS_HEIGHT }}
      >
        <button
          onClick={() => timelineStore.togglePlay()}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-white text-xs cursor-pointer border-none"
        >
          {snapshot.isPlaying ? '⏸' : '▶'}
        </button>
        <span className="text-xs text-gray-300 font-mono">
          {formatTime(snapshot.currentTime)} / {formatTime(snapshot.duration)}
        </span>

        {/* Media Toolbar - Add buttons (JianYing style) */}
        <div className="mx-2 border-l border-gray-600 pl-2">
          <MediaToolbar
            timeline={timelineStore.getTimeline()}
            timelineStore={timelineStore}
            resourceManager={engine.resourceManager}
          />
        </div>

        <div className="flex-1" />
        <label className="flex items-center gap-1.5 text-xs text-gray-400">
          Zoom
          <input
            type="range"
            min={1}
            max={100}
            value={Math.round(snapshot.zoom * 100)}
            onChange={(e) => timelineStore.setZoom(Number(e.target.value) / 100)}
            className="w-20 h-1"
          />
        </label>
      </div>

      {/* Main timeline area */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left: Track labels */}
        <div
          className="flex flex-col border-r border-gray-700 bg-gray-800 flex-shrink-0 overflow-hidden"
          style={{ width: TRACK_LABELS_WIDTH }}
        >
          {/* Ruler placeholder in labels area */}
          <div style={{ height: RULER_HEIGHT }} className="border-b border-gray-700" />
          <TrackLabels
            tracks={tracks}
            selectedTrackId={snapshot.selectedTrackId}
            onSelectTrack={(id) => timelineStore.selectTrack(id)}
            timeline={timelineStore.getTimeline()}
          />
        </div>

        {/* Right: Scrollable timeline area */}
        <div
          ref={tracksScrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative"
          onScroll={handleScroll}
          onWheel={handleWheel}
        >
          {/* Content wrapper with total width */}
          <div
            style={{ width: Math.max(totalWidthPx, 100), minHeight: '100%', position: 'relative' }}
          >
            {/* Time Ruler */}
            <TimeRuler
              zoom={snapshot.zoom}
              scrollLeft={snapshot.scrollLeft}
              duration={snapshot.duration}
              height={RULER_HEIGHT}
              onSeek={(time) => timelineStore.seek(time)}
            />

            {/* Track rows */}
            <div style={{ paddingTop: RULER_HEIGHT }}>
              {tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  zoom={snapshot.zoom}
                  scrollLeft={snapshot.scrollLeft}
                  selectedClipId={snapshot.selectedClipId}
                  onSelectClip={(id: string) => timelineStore.selectClip(id)}
                  timeline={timelineStore.getTimeline()}
                  timelineStore={timelineStore}
                  trackLayouts={trackLayouts}
                  onClipContextMenu={handleClipContextMenu}
                  onTrackContextMenu={handleTrackContextMenu}
                />
              ))}
              {tracks.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-500 text-xs">
                  No tracks. Add media to get started.
                </div>
              )}
            </div>

            {/* Playhead */}
            <Playhead
              currentTime={snapshot.currentTime}
              zoom={snapshot.zoom}
              scrollLeft={snapshot.scrollLeft}
              height={RULER_HEIGHT + tracks.length * 52}
              onSeek={(time: number) => timelineStore.seek(time)}
            />
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu state={menu} onClose={hideContextMenu} />
    </div>
  );
}
