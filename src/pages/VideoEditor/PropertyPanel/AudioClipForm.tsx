import type { Timeline } from '../../../engine/timeline/index';
import type { AudioClip } from '../../../engine/timeline/types';
import { NumberField } from './ClipPropertyPanel';
import { Section, SliderField } from './VideoClipForm';

// ============================================================================
// AudioClipForm - 音频片段属性
// ============================================================================

interface AudioClipFormProps {
  timeline: Timeline;
  clip: AudioClip;
}

export default function AudioClipForm({ timeline, clip }: AudioClipFormProps) {
  const update = (patch: Partial<AudioClip>) => {
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
        <NumberField
          label="入点 (ms)"
          value={clip.inPoint}
          min={0}
          step={50}
          onChange={(v) => update({ inPoint: v })}
        />
      </Section>

      <Section title="音量与淡入淡出">
        <SliderField
          label={`音量 ${(clip.volume * 100).toFixed(0)}%`}
          value={clip.volume}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => update({ volume: v })}
        />
        <NumberField
          label="淡入 (ms)"
          value={clip.fadeIn ?? 0}
          min={0}
          step={50}
          onChange={(v) => update({ fadeIn: v })}
        />
        <NumberField
          label="淡出 (ms)"
          value={clip.fadeOut ?? 0}
          min={0}
          step={50}
          onChange={(v) => update({ fadeOut: v })}
        />
      </Section>
    </div>
  );
}
