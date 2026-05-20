import type { Timeline } from '../../../engine/timeline/index';
import type { VideoClip } from '../../../engine/timeline/types';
import { NumberField } from './ClipPropertyPanel';

// ============================================================================
// VideoClipForm - 视频片段属性
// ============================================================================

interface VideoClipFormProps {
  timeline: Timeline;
  clip: VideoClip;
}

export default function VideoClipForm({ timeline, clip }: VideoClipFormProps) {
  const update = (patch: Partial<VideoClip>) => {
    timeline.updateClip(clip.id, patch);
  };

  const transform = clip.transform ?? { x: 0, y: 0, scale: 1, rotation: 0 };

  return (
    <div className="flex flex-col gap-4">
      <Section title="基础">
        <NumberField
          label="起始时间 (ms)"
          value={clip.startTime}
          min={0}
          step={50}
          onChange={(v) => update({ startTime: v })}
        />
        <NumberField
          label="时长 (ms)"
          value={clip.duration}
          min={50}
          step={50}
          onChange={(v) => update({ duration: v })}
        />
        <NumberField
          label="入点 (ms)"
          value={clip.inPoint}
          min={0}
          step={50}
          onChange={(v) => update({ inPoint: v })}
        />
      </Section>

      <Section title="播放">
        <SliderField
          label={`音量 ${(clip.volume * 100).toFixed(0)}%`}
          value={clip.volume}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => update({ volume: v })}
        />
        <SliderField
          label={`速度 ${clip.speed.toFixed(2)}x`}
          value={clip.speed}
          min={0.25}
          max={4}
          step={0.05}
          onChange={(v) => update({ speed: v })}
        />
      </Section>

      <Section title="变换">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="X"
            value={transform.x}
            step={1}
            onChange={(v) => update({ transform: { ...transform, x: v } })}
          />
          <NumberField
            label="Y"
            value={transform.y}
            step={1}
            onChange={(v) => update({ transform: { ...transform, y: v } })}
          />
          <NumberField
            label="缩放"
            value={transform.scale}
            min={0.1}
            step={0.1}
            onChange={(v) => update({ transform: { ...transform, scale: v } })}
          />
          <NumberField
            label="旋转 (°)"
            value={transform.rotation}
            step={1}
            onChange={(v) => update({ transform: { ...transform, rotation: v } })}
          />
        </div>
      </Section>
    </div>
  );
}

// ============================================================================
// 子组件
// ============================================================================

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="text-[11px] uppercase tracking-wider text-gray-500">{title}</div>
      {children}
    </section>
  );
}

export function SliderField({
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
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-300">
      <span>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
