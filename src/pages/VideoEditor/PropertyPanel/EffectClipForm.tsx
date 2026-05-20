import type { Timeline } from '../../../engine/timeline/index';
import type { EffectClip } from '../../../engine/timeline/types';
import { NumberField } from './ClipPropertyPanel';
import { Section } from './VideoClipForm';

// ============================================================================
// EffectClipForm - 特效片段基础属性（参数留 TODO）
// ============================================================================

interface EffectClipFormProps {
  timeline: Timeline;
  clip: EffectClip;
}

export default function EffectClipForm({ timeline, clip }: EffectClipFormProps) {
  const update = (patch: Partial<EffectClip>) => {
    timeline.updateClip(clip.id, patch);
  };

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
      </Section>

      <Section title="特效">
        <div className="text-xs text-gray-300">
          类型：<span className="text-blue-400">{clip.effectType}</span>
        </div>
        <div className="text-[11px] text-gray-500">特效参数表单将在后续迭代中扩展</div>
      </Section>
    </div>
  );
}
