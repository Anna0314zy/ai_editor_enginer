import { useSyncExternalStore } from 'react';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';
import type { Timeline } from '../../../engine/timeline/index';
import VideoClipForm from './VideoClipForm';
import AudioClipForm from './AudioClipForm';
import TextClipForm from './TextClipForm';
import EffectClipForm from './EffectClipForm';

// ============================================================================
// ClipPropertyPanel - 右侧属性面板
// 根据 timelineStore.selectedClipId 渲染对应 Clip 类型的表单
// 通过 useVideoTimeline 获取独立 timeline / store
// ============================================================================

export default function ClipPropertyPanel() {
  const { timeline, timelineStore } = useVideoTimeline();
  const snapshot = useSyncExternalStore(timelineStore.subscribe, () => timelineStore.getSnapshot());
  const clipId = snapshot.selectedClipId;
  const clip = clipId ? timeline.getClip(clipId) : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-gray-800 shrink-0">
        <div className="text-xs text-gray-400">属性</div>
        {clip && (
          <div className="text-xs text-gray-200 mt-0.5 truncate" title={clip.name}>
            {clip.name} <span className="text-[10px] text-gray-500">[{clip.type}]</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {!clip && (
          <div className="text-xs text-gray-500 text-center py-12">
            选中时间线中的片段以编辑属性
          </div>
        )}
        {clip?.type === 'video' && <VideoClipForm timeline={timeline} clip={clip} />}
        {clip?.type === 'audio' && <AudioClipForm timeline={timeline} clip={clip} />}
        {clip?.type === 'text' && <TextClipForm timeline={timeline} clip={clip} />}
        {clip?.type === 'effect' && <EffectClipForm timeline={timeline} clip={clip} />}
        {clip && (clip.type === 'sticker' || clip.type === 'shape') && (
          <BasicClipForm timeline={timeline} clip={clip} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 通用基础表单：startTime / duration
// ============================================================================

import type { Clip } from '../../../engine/timeline/types';

function BasicClipForm({ timeline, clip }: { timeline: Timeline; clip: Clip }) {
  return (
    <div className="flex flex-col gap-3">
      <NumberField
        label="起始时间 (ms)"
        value={clip.startTime}
        min={0}
        step={50}
        onChange={(v) => timeline.updateClip(clip.id, { startTime: v })}
      />
      <NumberField
        label="时长 (ms)"
        value={clip.duration}
        min={50}
        step={50}
        onChange={(v) => timeline.updateClip(clip.id, { duration: v })}
      />
      <div className="text-[11px] text-gray-500">贴纸 / 形状的高级编辑将在后续迭代中加入</div>
    </div>
  );
}

// ============================================================================
// 通用受控数字输入
// ============================================================================

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-300">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100 outline-none focus:border-blue-500"
      />
    </label>
  );
}
