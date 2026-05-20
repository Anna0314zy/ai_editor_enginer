import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Timeline } from '../../../engine/timeline/index';
import { TimelineStore } from '../../../store/timelineStore';
import { ResourceManager } from '../../../media/resourceManager';
import type { Track } from '../../../engine/timeline/types';

// ============================================================================
// VideoTimelineContext - /video 页专用的独立 Timeline / Store / ResourceManager
// 与 / 页（demoTracks）使用的全局 engine.timeline 完全隔离，互不影响。
// ============================================================================

export interface VideoTimelineContextValue {
  timeline: Timeline;
  timelineStore: TimelineStore;
  resourceManager: ResourceManager;
}

const Ctx = createContext<VideoTimelineContextValue | null>(null);

const MAIN_VIDEO_TRACK_ID = 'track-main-video';

export function VideoTimelineProvider({ children }: { children: ReactNode }) {
  const [timeline] = useState(() => new Timeline());
  const [timelineStore] = useState(() => new TimelineStore(timeline));
  const [resourceManager] = useState(() => new ResourceManager());

  // 初始化：默认创建 1 条空主视频轨
  useEffect(() => {
    // StrictMode 下上一轮 cleanup 可能已 destroy，这里重新 attach
    timelineStore.attach();
    if (!timeline.getTrack(MAIN_VIDEO_TRACK_ID)) {
      const mainTrack: Track = {
        id: MAIN_VIDEO_TRACK_ID,
        type: 'video',
        name: '主视频',
        clips: [],
        locked: false,
        visible: true,
        order: 0,
      };
      timeline.addTrack(mainTrack);
    }
    return () => {
      // 不调 destroy：StrictMode 下 cleanup -> mount 会导致 store 解除订阅后未重挪，
      // 导致 timeline 变更不再触发 React 重渲。组件真正卸载时整个对象图会 GC。
    };
  }, [timeline, timelineStore]);

  return (
    <Ctx.Provider value={{ timeline, timelineStore, resourceManager }}>{children}</Ctx.Provider>
  );
}

export function useVideoTimeline(): VideoTimelineContextValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useVideoTimeline must be inside <VideoTimelineProvider>');
  }
  return v;
}

export { MAIN_VIDEO_TRACK_ID };
