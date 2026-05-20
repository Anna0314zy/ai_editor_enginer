import { useDraggable } from '@dnd-kit/core';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';
import { placeEffect, newClipId } from '../timeline/timelineRules';
import type { EffectClip } from '../../../engine/timeline/types';

// ============================================================================
// EffectTab - 示例特效（仅插入数据，渲染层后续接入）
// 点击或拖拽插入到 effect 轨。
// ============================================================================

interface EffectPreset {
  id: string;
  label: string;
  effectType: string;
  icon: string;
}

const EFFECTS: EffectPreset[] = [
  { id: 'blur', label: '模糊', effectType: 'blur', icon: '🌫' },
  { id: 'glow', label: '辉光', effectType: 'glow', icon: '✨' },
  { id: 'shake', label: '抖动', effectType: 'shake', icon: '🌀' },
  { id: 'fade', label: '渐隐', effectType: 'fade', icon: '🌗' },
];

const DEFAULT_DURATION = 2000;

function buildEffectClip(preset: EffectPreset, startTime: number): EffectClip {
  return {
    id: newClipId('clip-effect'),
    trackId: '',
    type: 'effect',
    name: preset.label,
    startTime,
    duration: DEFAULT_DURATION,
    endTime: startTime + DEFAULT_DURATION,
    inPoint: 0,
    effectType: preset.effectType,
    params: {},
  };
}

export default function EffectTab() {
  const { timeline, timelineStore } = useVideoTimeline();

  const handleAdd = (preset: EffectPreset) => {
    const currentTime = timelineStore.getSnapshot().currentTime;
    const clip = buildEffectClip(preset, currentTime);
    const placed = placeEffect({ timeline, dropTime: currentTime }, clip);
    if (placed) timelineStore.selectClip(placed.id);
  };

  return (
    <div className="p-3 grid grid-cols-2 gap-2">
      {EFFECTS.map((e) => (
        <DraggableEffect key={e.id} preset={e} onAdd={() => handleAdd(e)} />
      ))}
      <div className="col-span-2 text-[10px] text-gray-500 text-center pt-2">
        特效仅插入占位数据，实际渲染将在后续迭代中接入
      </div>
    </div>
  );
}

function DraggableEffect({ preset, onAdd }: { preset: EffectPreset; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `effect-${preset.id}`,
    data: {
      kind: 'effect',
      payload: {
        name: preset.label,
        effectType: preset.effectType,
        duration: DEFAULT_DURATION,
      },
    },
  });

  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      className={`aspect-video rounded bg-gray-900 border border-gray-800 hover:border-blue-500 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-1 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="text-2xl">{preset.icon}</div>
      <div className="text-[11px] text-gray-300">{preset.label}</div>
    </button>
  );
}
