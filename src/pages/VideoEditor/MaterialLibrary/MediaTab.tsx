import { useCallback, useRef, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';
import {
  createVideoClip,
  createAudioClip,
  importMediaFile,
} from '../../../components/TimelinePanel/clipFactory';
import {
  placeVideoOrImage,
  placeAudio,
  getMainVideoTrack,
  computeMainVideoSnapStart,
} from '../timeline/timelineRules';
import type { MediaResource } from '../../../engine/timeline/types';

// ============================================================================
// MediaTab - 媒体 Tab：上传本地视频/音频/图片，列表展示
// 列表项使用 @dnd-kit useDraggable 支持拖拽到时间线
// 点击「+」按钮根据类型路由到主视频拼接 / 音频混音
// ============================================================================

interface MediaItem extends MediaResource {
  fileName?: string;
}

export default function MediaTab() {
  const { timeline, timelineStore, resourceManager } = useVideoTimeline();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setItems(resourceManager.getAll().map((r) => ({ ...r })));
  }, [resourceManager]);

  const handlePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      setBusy(true);
      try {
        for (const file of files) {
          const result = await importMediaFile(file, resourceManager);
          const resource = resourceManager.get(result.resourceId);
          if (resource) {
            setItems((prev) => [...prev, { ...resource, fileName: result.name }]);
          }
        }
      } catch (err) {
        console.error('[MediaTab] import failed:', err);
      } finally {
        setBusy(false);
        e.target.value = '';
      }
    },
    [resourceManager],
  );

  // 点击 + 按钮：根据类型路由
  const handleAddToTimeline = useCallback(
    (item: MediaItem) => {
      const currentTime = timelineStore.getSnapshot().currentTime;
      const duration = item.duration ?? 5000;
      const name = item.fileName ?? item.id;

      if (item.type === 'video' || item.type === 'image') {
        // 默认插入主视频轨末尾（拼接）
        const main = getMainVideoTrack(timeline);
        const clip = createVideoClip({
          startTime: currentTime,
          duration: item.type === 'image' ? 3000 : duration,
          name,
          resourceId: item.id,
        });
        if (main) {
          const start = computeMainVideoSnapStart(main, clip.duration, currentTime);
          placeVideoOrImage(
            { timeline, dropTime: start, hoverTrackId: main.id, hoverTrackType: 'video' },
            clip,
          );
        } else {
          placeVideoOrImage({ timeline, dropTime: currentTime }, clip);
        }
        timelineStore.selectClip(clip.id);
      } else if (item.type === 'audio') {
        const clip = createAudioClip({
          startTime: currentTime,
          duration,
          name,
          resourceId: item.id,
        });
        placeAudio({ timeline, dropTime: currentTime }, clip);
        timelineStore.selectClip(clip.id);
      }
    },
    [timeline, timelineStore],
  );

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const typeLabel = (t: MediaResource['type']) =>
    t === 'video' ? '视频' : t === 'audio' ? '音频' : '图片';

  return (
    <div className="p-3 flex flex-col gap-3">
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        className={`w-full py-2 text-xs rounded border-2 border-dashed ${
          busy
            ? 'border-gray-700 text-gray-500 cursor-not-allowed'
            : 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 cursor-pointer'
        } bg-gray-900`}
      >
        {busy ? '导入中…' : '＋ 上传本地素材'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {items.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-8">
          暂无素材，点击上方按钮上传视频 / 音频 / 图片
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <DraggableMediaItem
              key={item.id}
              item={item}
              typeLabel={typeLabel(item.type)}
              durationLabel={formatDuration(item.duration)}
              onAdd={() => handleAddToTimeline(item)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// DraggableMediaItem
// ============================================================================

function DraggableMediaItem({
  item,
  typeLabel,
  durationLabel,
  onAdd,
}: {
  item: MediaItem;
  typeLabel: string;
  durationLabel: string;
  onAdd: () => void;
}) {
  const dragKind =
    item.type === 'video' ? 'media-video' : item.type === 'audio' ? 'media-audio' : 'media-image';

  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `media-${item.id}`,
    data: {
      kind: dragKind,
      payload: {
        resourceId: item.id,
        duration: item.duration,
        name: item.fileName ?? item.id,
        mediaType: item.type,
      },
    },
  });

  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="w-12 h-12 rounded bg-black flex items-center justify-center text-lg shrink-0 overflow-hidden">
        {item.type === 'image' ? (
          <img
            src={item.src}
            alt={item.fileName ?? 'thumbnail'}
            className="w-full h-full object-cover"
          />
        ) : item.type === 'video' ? (
          '🎬'
        ) : (
          '🎵'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-200 truncate" title={item.fileName ?? item.id}>
          {item.fileName ?? item.id}
        </div>
        <div className="text-[10px] text-gray-500">
          {typeLabel} · {durationLabel}
        </div>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onAdd}
        className="px-2 py-1 text-[10px] rounded bg-blue-600 text-white hover:bg-blue-500 cursor-pointer border-none"
      >
        ＋
      </button>
    </li>
  );
}
