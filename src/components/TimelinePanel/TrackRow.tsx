import type { Track } from '../../engine/timeline/types';
import type { Timeline } from '../../engine/timeline/index';
import type { TimelineStore } from '../../store/timelineStore';
import type { TrackLayout } from './interactions';
import ClipBlock from './ClipBlock';

// ============================================================================
// TrackRow - Single track row displaying clips
// ============================================================================

interface TrackRowProps {
  track: Track;
  zoom: number; // px/ms
  scrollLeft: number; // ms
  selectedClipId: string | null;
  onSelectClip: (clipId: string) => void;
  timeline: Timeline;
  timelineStore: TimelineStore;
  trackLayouts?: TrackLayout[];
  onClipContextMenu?: (e: React.MouseEvent, clipId: string) => void;
  onTrackContextMenu?: (e: React.MouseEvent, trackId: string) => void;
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

const TRACK_BG_COLORS: Record<string, string> = {
  video: 'bg-gray-850',
  audio: 'bg-gray-900',
  overlay: 'bg-gray-875',
  pip: 'bg-gray-850',
  subtitle: 'bg-gray-875',
  sticker: 'bg-gray-875',
  effect: 'bg-gray-875',
};

export default function TrackRow({
  track,
  zoom,
  scrollLeft,
  selectedClipId,
  onSelectClip,
  timeline,
  timelineStore,
  trackLayouts,
  onClipContextMenu,
  onTrackContextMenu,
}: TrackRowProps) {
  const height = TRACK_HEIGHTS[track.type] || 48;

  return (
    <div
      className={`relative border-b border-gray-700 ${TRACK_BG_COLORS[track.type] || ''}`}
      style={{ height, minHeight: height }}
      onContextMenu={(e) => {
        if (onTrackContextMenu) {
          onTrackContextMenu(e, track.id);
        }
      }}
    >
      {track.clips.map((clip) => (
        <ClipBlock
          key={clip.id}
          clip={clip}
          zoom={zoom}
          scrollLeft={scrollLeft}
          trackHeight={height}
          isSelected={clip.id === selectedClipId}
          onSelect={() => onSelectClip(clip.id)}
          timeline={timeline}
          timelineStore={timelineStore}
          trackLayouts={trackLayouts}
          onContextMenu={onClipContextMenu}
        />
      ))}

      {/* Empty track indicator */}
      {track.clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-gray-600 italic">Empty track</span>
        </div>
      )}
    </div>
  );
}
