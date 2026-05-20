import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Engine } from '../../engine';
import type { AnimationEngine } from '../../animation';
import type { TrackType, EffectClip } from '../../engine/timeline/types';
import VideoHeader from './VideoHeader';
import MaterialLibrary from './MaterialLibrary/MaterialLibrary';
import PreviewStage from './PreviewStage/PreviewStage';
import ClipPropertyPanel from './PropertyPanel/ClipPropertyPanel';
import VideoTimelinePanel from './timeline/VideoTimelinePanel';
import { VideoTimelineProvider, useVideoTimeline } from './timeline/VideoTimelineContext';
import {
  placeVideoOrImage,
  placeAudio,
  placeText,
  placeSticker,
  placeEffect,
  computeMainVideoSnapStart,
  getMainVideoTrack,
  newClipId,
} from './timeline/timelineRules';
import {
  createVideoClip,
  createAudioClip,
  createTextClip,
  createStickerClip,
} from '../../components/TimelinePanel/clipFactory';

// ============================================================================
// VideoEditorPage - 剪映式音视频编辑页（路由 /video）
// 顶部 Header / 左素材库 / 中预览 / 右属性 / 底部多轨时间线
// 通过 VideoTimelineProvider 注入独立 Timeline / Store / ResourceManager
// 通过 DndContext 路由素材库到时间线的拖拽
// ============================================================================

interface VideoEditorPageProps {
  engine: Engine;
  // animationEngine 暂未在视频页直接使用，保留以便后续接入关键帧/转场
  animationEngine: AnimationEngine;
}

export default function VideoEditorPage({ engine }: VideoEditorPageProps) {
  return (
    <VideoTimelineProvider>
      <VideoEditorInner engine={engine} />
    </VideoTimelineProvider>
  );
}

// ============================================================================
// 内层：必须在 Provider 内才能用 useVideoTimeline
// ============================================================================

interface DragPayload {
  resourceId?: string;
  duration?: number;
  name?: string;
  mediaType?: 'video' | 'audio' | 'image';
  content?: string;
  fontSize?: number;
  color?: string;
  emoji?: string;
  effectType?: string;
}

interface DragData {
  kind: 'media-video' | 'media-audio' | 'media-image' | 'text' | 'sticker' | 'effect';
  payload: DragPayload;
}

interface DropData {
  kind: 'track' | 'gap';
  trackId?: string;
  trackType?: TrackType;
  position?: 'top' | 'bottom';
}

function VideoEditorInner({ engine }: { engine: Engine }) {
  const { timeline, timelineStore } = useVideoTimeline();

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!active) return;
    const aData = active.data.current as DragData | undefined;
    const oData = over?.data.current as DropData | undefined;
    if (!aData) {
      console.warn('[VideoEditor] drag end without DragData', { active, over });
      return;
    }

    // 落点时间：使用当前 playhead（后续可改为像素反算）
    const dropTime = timelineStore.getSnapshot().currentTime;
    const hoverTrackId = oData?.kind === 'track' ? oData.trackId : undefined;
    const hoverTrackType = oData?.kind === 'track' ? oData.trackType : undefined;

    console.log('[VideoEditor] drag end', {
      kind: aData.kind,
      hoverTrackType,
      hoverTrackId,
      dropTime,
      overId: over?.id,
    });

    switch (aData.kind) {
      case 'media-video':
      case 'media-image': {
        const p = aData.payload;
        const dur = aData.kind === 'media-image' ? 3000 : (p.duration ?? 5000);
        const clip = createVideoClip({
          startTime: dropTime,
          duration: dur,
          name: p.name ?? 'Video',
          resourceId: p.resourceId,
        });
        // 落到主视频轨：贴尾拼接
        let dt = dropTime;
        if (hoverTrackType === 'video') {
          const track = hoverTrackId
            ? timeline.getTrack(hoverTrackId)
            : getMainVideoTrack(timeline);
          if (track) dt = computeMainVideoSnapStart(track, clip.duration, dropTime);
        }
        const placed = placeVideoOrImage(
          { timeline, dropTime: dt, hoverTrackId, hoverTrackType },
          clip,
        );
        if (placed) timelineStore.selectClip(placed.id);
        break;
      }
      case 'media-audio': {
        const p = aData.payload;
        const clip = createAudioClip({
          startTime: dropTime,
          duration: p.duration ?? 5000,
          name: p.name ?? 'Audio',
          resourceId: p.resourceId,
        });
        const placed = placeAudio({ timeline, dropTime, hoverTrackId, hoverTrackType }, clip);
        if (placed) timelineStore.selectClip(placed.id);
        break;
      }
      case 'text': {
        const p = aData.payload;
        const clip = createTextClip({
          startTime: dropTime,
          content: p.content ?? '默认文本',
          name: p.name ?? '文本',
        });
        clip.style = {
          fontSize: p.fontSize ?? 28,
          fontFamily: 'sans-serif',
          color: p.color ?? '#ffffff',
          align: 'center',
        };
        const placed = placeText({ timeline, dropTime, hoverTrackId, hoverTrackType }, clip);
        if (placed) timelineStore.selectClip(placed.id);
        break;
      }
      case 'sticker': {
        const p = aData.payload;
        const clip = createStickerClip({
          startTime: dropTime,
          name: p.name ?? '贴纸',
        });
        const placed = placeSticker({ timeline, dropTime, hoverTrackId, hoverTrackType }, clip);
        if (placed) timelineStore.selectClip(placed.id);
        break;
      }
      case 'effect': {
        const p = aData.payload;
        const dur = p.duration ?? 2000;
        const clip: EffectClip = {
          id: newClipId('clip-effect'),
          trackId: '',
          type: 'effect',
          name: p.name ?? '特效',
          startTime: dropTime,
          duration: dur,
          endTime: dropTime + dur,
          inPoint: 0,
          effectType: p.effectType ?? 'blur',
          params: {},
        };
        const placed = placeEffect({ timeline, dropTime, hoverTrackId, hoverTrackType }, clip);
        if (placed) timelineStore.selectClip(placed.id);
        break;
      }
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="w-screen h-screen flex flex-col bg-gray-900 text-gray-200 overflow-hidden">
        <VideoHeader engine={engine} />

        {/* 上半部：左素材库 / 中预览 / 右属性 */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <aside className="w-[280px] shrink-0 border-r border-gray-800 bg-gray-950 overflow-hidden">
            <MaterialLibrary />
          </aside>
          <main className="flex-1 min-w-0 overflow-hidden flex flex-col bg-black">
            <PreviewStage />
          </main>
          <aside className="w-[320px] shrink-0 border-l border-gray-800 bg-gray-950 overflow-hidden">
            <ClipPropertyPanel />
          </aside>
        </div>

        {/* 底部：剪映式多轨时间线 */}
        <VideoTimelinePanel />
      </div>
    </DndContext>
  );
}
