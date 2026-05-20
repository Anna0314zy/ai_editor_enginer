import { useSyncExternalStore } from 'react';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';

// ============================================================================
// PreviewControls - 预览控制条
// 跳到首尾 / 播放暂停 / 当前时间 / 总时长
// 通过 useVideoTimeline 注入的 timelineStore 控制
// ============================================================================

function formatTime(ms: number): string {
  const total = Math.max(0, ms);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = Math.floor(total % 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

export default function PreviewControls() {
  const { timelineStore } = useVideoTimeline();
  const snapshot = useSyncExternalStore(timelineStore.subscribe, () => timelineStore.getSnapshot());

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-gray-900 border border-gray-800">
      <button
        type="button"
        onClick={() => timelineStore.seek(0)}
        className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs cursor-pointer border-none"
        title="跳到开头"
      >
        ⏮
      </button>
      <button
        type="button"
        onClick={() => timelineStore.togglePlay()}
        className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-base cursor-pointer border-none flex items-center justify-center"
        title={snapshot.isPlaying ? '暂停' : '播放'}
      >
        {snapshot.isPlaying ? '⏸' : '▶'}
      </button>
      <button
        type="button"
        onClick={() => timelineStore.seek(snapshot.duration)}
        className="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs cursor-pointer border-none"
        title="跳到末尾"
      >
        ⏭
      </button>
      <span className="text-xs text-gray-300 font-mono ml-2">
        {formatTime(snapshot.currentTime)} / {formatTime(snapshot.duration)}
      </span>
    </div>
  );
}
