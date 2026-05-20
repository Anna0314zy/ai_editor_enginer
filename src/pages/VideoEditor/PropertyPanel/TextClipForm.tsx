import type { Timeline } from '../../../engine/timeline/index';
import type { TextClip, TextClipStyle } from '../../../engine/timeline/types';
import { NumberField } from './ClipPropertyPanel';
import { Section } from './VideoClipForm';

// ============================================================================
// TextClipForm - 文本片段属性
// ============================================================================

interface TextClipFormProps {
  timeline: Timeline;
  clip: TextClip;
}

const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace', 'cursive'];
const ALIGNS: TextClipStyle['align'][] = ['left', 'center', 'right'];

export default function TextClipForm({ timeline, clip }: TextClipFormProps) {
  const update = (patch: Partial<TextClip>) => {
    timeline.updateClip(clip.id, patch);
  };

  const updateStyle = (patch: Partial<TextClipStyle>) => {
    update({ style: { ...clip.style, ...patch } });
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

      <Section title="内容">
        <label className="flex flex-col gap-1 text-xs text-gray-300">
          <span>文字</span>
          <textarea
            value={clip.content}
            onChange={(e) => update({ content: e.target.value })}
            rows={3}
            className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100 outline-none focus:border-blue-500 resize-none"
          />
        </label>
      </Section>

      <Section title="样式">
        <NumberField
          label="字号"
          value={clip.style.fontSize}
          min={8}
          max={200}
          step={1}
          onChange={(v) => updateStyle({ fontSize: v })}
        />
        <label className="flex flex-col gap-1 text-xs text-gray-300">
          <span>字体</span>
          <select
            value={clip.style.fontFamily}
            onChange={(e) => updateStyle({ fontFamily: e.target.value })}
            className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-100 outline-none focus:border-blue-500"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-300">
          <span>颜色</span>
          <input
            type="color"
            value={clip.style.color}
            onChange={(e) => updateStyle({ color: e.target.value })}
            className="w-full h-8 rounded bg-gray-900 border border-gray-700 cursor-pointer"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-300">
          <span>对齐</span>
          <div className="flex gap-1">
            {ALIGNS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => updateStyle({ align: a })}
                className={`flex-1 py-1 rounded text-xs cursor-pointer border ${
                  clip.style.align === a
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </label>
      </Section>
    </div>
  );
}
