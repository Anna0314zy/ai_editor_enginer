import { useCallback, useRef } from 'react';
import type { Timeline } from '../../engine/timeline/index';
import type { TimelineStore } from '../../store/timelineStore';
import type { ResourceManager } from '../../media/resourceManager';
import {
  createVideoClip,
  createAudioClip,
  createTextClip,
  createStickerClip,
  findOrCreateTrack,
  importMediaFile,
} from './clipFactory';

// ============================================================================
// MediaToolbar - Toolbar buttons for adding media to the Timeline
// Mirrors JianYing/CapCut bottom toolbar: Video | Audio | Text | Sticker
// ============================================================================

interface MediaToolbarProps {
  timeline: Timeline;
  timelineStore: TimelineStore;
  resourceManager: ResourceManager;
}

export default function MediaToolbar({
  timeline,
  timelineStore,
  resourceManager,
}: MediaToolbarProps) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // --- Add Text ---
  const handleAddText = useCallback(() => {
    const currentTime = timelineStore.getSnapshot().currentTime;
    const clip = createTextClip({ startTime: currentTime });
    const trackId = findOrCreateTrack(timeline, 'text');
    timeline.addClip(trackId, clip);
    timelineStore.selectClip(clip.id);
  }, [timeline, timelineStore]);

  // --- Add Sticker ---
  const handleAddSticker = useCallback(() => {
    const currentTime = timelineStore.getSnapshot().currentTime;
    const clip = createStickerClip({ startTime: currentTime });
    const trackId = findOrCreateTrack(timeline, 'sticker');
    timeline.addClip(trackId, clip);
    timelineStore.selectClip(clip.id);
  }, [timeline, timelineStore]);

  // --- Add Video (file picker) ---
  const handleAddVideo = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const handleVideoFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const result = await importMediaFile(file, resourceManager);
        const currentTime = timelineStore.getSnapshot().currentTime;
        const clip = createVideoClip({
          startTime: currentTime,
          duration: result.duration,
          name: result.name,
          resourceId: result.resourceId,
        });
        const trackId = findOrCreateTrack(timeline, 'video');
        timeline.addClip(trackId, clip);
        timelineStore.selectClip(clip.id);
      } catch (err) {
        console.error('[MediaToolbar] Failed to import video:', err);
      }

      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [timeline, timelineStore, resourceManager],
  );

  // --- Add Audio (file picker) ---
  const handleAddAudio = useCallback(() => {
    audioInputRef.current?.click();
  }, []);

  const handleAudioFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const result = await importMediaFile(file, resourceManager);
        const currentTime = timelineStore.getSnapshot().currentTime;
        const clip = createAudioClip({
          startTime: currentTime,
          duration: result.duration,
          name: result.name,
          resourceId: result.resourceId,
        });
        const trackId = findOrCreateTrack(timeline, 'audio');
        timeline.addClip(trackId, clip);
        timelineStore.selectClip(clip.id);
      } catch (err) {
        console.error('[MediaToolbar] Failed to import audio:', err);
      }

      e.target.value = '';
    },
    [timeline, timelineStore, resourceManager],
  );

  return (
    <>
      <div className="flex items-center gap-1">
        <ToolbarButton icon="🎬" label="视频" onClick={handleAddVideo} />
        <ToolbarButton icon="🎵" label="音频" onClick={handleAddAudio} />
        <ToolbarButton icon="T" label="文本" onClick={handleAddText} />
        <ToolbarButton icon="⭐" label="贴纸" onClick={handleAddSticker} />
      </div>

      {/* Hidden file inputs */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFileChange}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleAudioFileChange}
      />
    </>
  );
}

// --- Internal Button Component ---

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-0.5 px-2 py-1 rounded text-[11px] text-gray-300 bg-gray-700 hover:bg-gray-600 border-none cursor-pointer transition-colors"
      title={`添加${label}`}
    >
      <span className="text-xs">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
