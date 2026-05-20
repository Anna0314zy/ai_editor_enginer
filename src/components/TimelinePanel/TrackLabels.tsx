import { useRef, useCallback, useState } from 'react';
import type { Track } from '../../engine/timeline/types';
import type { Timeline } from '../../engine/timeline/index';

// ============================================================================
// TrackLabels - Fixed left column showing track names and controls
// Supports drag-to-reorder tracks via Pointer Events.
// ============================================================================

interface TrackLabelsProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string) => void;
  timeline: Timeline;
  /** 可选：某条轨道是否可拖拽重排（默认 true）。返回 false 时隐藏拖拽手柄。 */
  canReorder?: (track: Track) => boolean;
}

const TRACK_HEIGHTS: Record<string, number> = {
  video: 60,
  audio: 40,
  overlay: 48,
  pip: 48,
  subtitle: 36,
  sticker: 36,
  effect: 36,
};

const TRACK_ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  overlay: '📝',
  pip: '🖼',
  subtitle: '💬',
  sticker: '⭐',
  effect: '✨',
};

export default function TrackLabels({
  tracks,
  selectedTrackId,
  onSelectTrack,
  timeline,
  canReorder,
}: TrackLabelsProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.PointerEvent, trackIndex: number) => {
      // Only start drag on grip area (left side of label)
      e.preventDefault();
      draggingIndexRef.current = trackIndex;

      const startY = e.clientY;
      const trackHeights = tracks.map((t) => TRACK_HEIGHTS[t.type] || 48);

      const onMove = (ev: PointerEvent) => {
        const deltaY = ev.clientY - startY;
        // Calculate which index the track would be over
        let accum = 0;
        let targetIndex = trackIndex;
        if (deltaY > 0) {
          // Moving down
          for (let i = trackIndex + 1; i < tracks.length; i++) {
            accum += trackHeights[i];
            if (deltaY > accum - trackHeights[i] / 2) {
              targetIndex = i;
            } else {
              break;
            }
          }
        } else {
          // Moving up
          for (let i = trackIndex - 1; i >= 0; i--) {
            accum -= trackHeights[i];
            if (deltaY < accum + trackHeights[i] / 2) {
              targetIndex = i;
            } else {
              break;
            }
          }
        }
        setDragOverIndex(targetIndex);
      };

      const onUp = () => {
        if (
          draggingIndexRef.current !== null &&
          dragOverIndex !== null &&
          draggingIndexRef.current !== dragOverIndex
        ) {
          // Reorder tracks
          const newOrder = [...tracks.map((t) => t.id)];
          const [removed] = newOrder.splice(draggingIndexRef.current, 1);
          newOrder.splice(dragOverIndex, 0, removed);
          timeline.reorderTracks(newOrder);
        }
        draggingIndexRef.current = null;
        setDragOverIndex(null);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [tracks, timeline, dragOverIndex],
  );

  return (
    <div className="flex flex-col overflow-y-auto">
      {tracks.map((track, index) => {
        const height = TRACK_HEIGHTS[track.type] || 48;
        const isSelected = track.id === selectedTrackId;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={track.id}
            className={`flex items-center gap-1 px-1 border-b border-gray-700 cursor-pointer transition-colors ${
              isSelected ? 'bg-gray-700' : 'hover:bg-gray-750'
            } ${isDragOver ? 'border-t-2 border-t-blue-400' : ''}`}
            style={{ height, minHeight: height }}
            onClick={() => onSelectTrack(track.id)}
          >
            {/* Drag grip：只在可重排时显示 */}
            {(canReorder ? canReorder(track) : true) ? (
              <div
                className="flex items-center justify-center w-4 h-full cursor-grab text-gray-500 hover:text-gray-300"
                onPointerDown={(e) => handleDragStart(e, index)}
                title="Drag to reorder"
              >
                <span className="text-[10px]">⋮⋮</span>
              </div>
            ) : (
              <div className="w-4 h-full" />
            )}
            <span className="text-sm">{TRACK_ICONS[track.type] || '📎'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-200 truncate">{track.name}</div>
              <div className="text-[10px] text-gray-500">{track.type}</div>
            </div>
            <div className="flex gap-0.5">
              <span
                className={`text-[10px] cursor-pointer ${track.visible ? 'text-gray-400' : 'text-gray-600'}`}
                title={track.visible ? 'Visible' : 'Hidden'}
              >
                {track.visible ? '👁' : '👁‍🗨'}
              </span>
              <span
                className={`text-[10px] ${track.locked ? 'text-yellow-500' : 'text-gray-600'}`}
                title={track.locked ? 'Locked' : 'Unlocked'}
              >
                {track.locked ? '🔒' : '🔓'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
