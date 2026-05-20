import { useCallback, useRef } from 'react';
import type { Clip, ClipType } from '../../engine/timeline/types';
import type { Timeline } from '../../engine/timeline/index';
import type { TimelineStore } from '../../store/timelineStore';
import { startClipDrag, type TrackLayout } from './interactions';

// ============================================================================
// ClipBlock - Visual representation of a clip on the timeline
// Supports selection, drag move, and trim resize (left/right handles)
// ============================================================================

interface ClipBlockProps {
  clip: Clip;
  zoom: number; // px/ms
  scrollLeft: number; // ms
  trackHeight: number; // px
  isSelected: boolean;
  onSelect: () => void;
  timeline: Timeline;
  timelineStore: TimelineStore;
  trackLayouts?: TrackLayout[];
  onContextMenu?: (e: React.MouseEvent, clipId: string) => void;
}

const CLIP_COLORS: Record<ClipType, string> = {
  video: '#4A90D9',
  audio: '#48BB78',
  text: '#ECC94B',
  sticker: '#9F7AEA',
  shape: '#ED8936',
  effect: '#E53E3E',
};

const TRIM_HANDLE_WIDTH = 5;
const CLIP_BORDER_RADIUS = 3;
const CLIP_PADDING_Y = 3; // Top/bottom padding within track

export default function ClipBlock({
  clip,
  zoom,
  scrollLeft,
  trackHeight,
  isSelected,
  onSelect,
  timeline,
  timelineStore,
  trackLayouts,
  onContextMenu,
}: ClipBlockProps) {
  const draggingRef = useRef<'move' | 'trim-left' | 'trim-right' | null>(null);

  const left = clip.startTime * zoom;
  const width = clip.duration * zoom;
  const height = trackHeight - CLIP_PADDING_Y * 2;

  const bgColor = CLIP_COLORS[clip.type] || '#6B7280';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect();

      // Determine drag type from click position within clip
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const relX = e.clientX - rect.left;

      let dragType: 'move' | 'trim-left' | 'trim-right';
      if (relX <= TRIM_HANDLE_WIDTH) {
        dragType = 'trim-left';
      } else if (relX >= rect.width - TRIM_HANDLE_WIDTH) {
        dragType = 'trim-right';
      } else {
        dragType = 'move';
      }

      draggingRef.current = dragType;
      startClipDrag(
        e.nativeEvent,
        clip,
        dragType,
        timeline,
        timelineStore,
        {
          onDragEnd: () => {
            draggingRef.current = null;
          },
        },
        trackLayouts,
      );
    },
    [onSelect, clip, timeline, timelineStore, trackLayouts],
  );

  // Don't render if completely off-screen (basic virtualization)
  const clipEndPx = clip.endTime * zoom;
  const viewportEndPx = (scrollLeft + 20000) * zoom; // generous buffer
  if (clipEndPx < 0 || left > viewportEndPx) return null;

  return (
    <div
      className="absolute flex items-center overflow-hidden cursor-pointer transition-shadow"
      style={{
        left,
        width: Math.max(width, 4), // Minimum visible width
        top: CLIP_PADDING_Y,
        height,
        backgroundColor: bgColor,
        borderRadius: CLIP_BORDER_RADIUS,
        border: isSelected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
        boxShadow: isSelected ? '0 0 6px rgba(255,255,255,0.3)' : 'none',
        opacity: 0.9,
      }}
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, clip.id);
        }
      }}
    >
      {/* Left trim handle */}
      <div
        className="absolute top-0 bottom-0 left-0 cursor-col-resize hover:bg-white/20"
        style={{
          width: TRIM_HANDLE_WIDTH,
          borderRadius: `${CLIP_BORDER_RADIUS}px 0 0 ${CLIP_BORDER_RADIUS}px`,
        }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 px-1.5">
        <span className="text-[10px] text-white font-medium truncate block drop-shadow-sm">
          {clip.name}
        </span>
        {width > 60 && (
          <span className="text-[9px] text-white/60 truncate block">
            {(clip.duration / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Right trim handle */}
      <div
        className="absolute top-0 bottom-0 right-0 cursor-col-resize hover:bg-white/20"
        style={{
          width: TRIM_HANDLE_WIDTH,
          borderRadius: `0 ${CLIP_BORDER_RADIUS}px ${CLIP_BORDER_RADIUS}px 0`,
        }}
      />
    </div>
  );
}
