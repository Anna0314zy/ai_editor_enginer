import { useDraggable } from '@dnd-kit/core';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';
import { createTextClip } from '../../../components/TimelinePanel/clipFactory';
import { placeText } from '../timeline/timelineRules';

// ============================================================================
// TextTab - 内置文本预设。点击插入到 subtitle 轨；列表项支持拖拽。
// ============================================================================

interface TextPreset {
  id: string;
  label: string;
  preview: string;
  content: string;
  fontSize: number;
  color: string;
}

const PRESETS: TextPreset[] = [
  {
    id: 'title',
    label: '主标题',
    preview: '主标题',
    content: '主标题',
    fontSize: 48,
    color: '#ffffff',
  },
  {
    id: 'subtitle',
    label: '副标题',
    preview: '副标题',
    content: '副标题',
    fontSize: 32,
    color: '#e5e7eb',
  },
  {
    id: 'subtitle-line',
    label: '字幕',
    preview: '这是一段字幕',
    content: '这是一段字幕',
    fontSize: 24,
    color: '#ffffff',
  },
  {
    id: 'cta',
    label: '强调文字',
    preview: '点击关注',
    content: '点击关注',
    fontSize: 36,
    color: '#fbbf24',
  },
];

export default function TextTab() {
  const { timeline, timelineStore } = useVideoTimeline();

  const handleAdd = (preset: TextPreset) => {
    const currentTime = timelineStore.getSnapshot().currentTime;
    const clip = createTextClip({
      startTime: currentTime,
      content: preset.content,
      name: preset.label,
    });
    clip.style = {
      fontSize: preset.fontSize,
      fontFamily: 'sans-serif',
      color: preset.color,
      align: 'center',
    };
    const placed = placeText({ timeline, dropTime: currentTime }, clip);
    if (placed) timelineStore.selectClip(placed.id);
  };

  return (
    <div className="p-3 grid grid-cols-2 gap-2">
      {PRESETS.map((p) => (
        <DraggableTextPreset key={p.id} preset={p} onAdd={() => handleAdd(p)} />
      ))}
    </div>
  );
}

// ============================================================================
// DraggableTextPreset
// ============================================================================

function DraggableTextPreset({ preset, onAdd }: { preset: TextPreset; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `text-${preset.id}`,
    data: {
      kind: 'text',
      payload: {
        content: preset.content,
        name: preset.label,
        fontSize: preset.fontSize,
        color: preset.color,
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
      className={`aspect-video rounded bg-gray-900 border border-gray-800 hover:border-blue-500 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-1 px-2 py-3 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div
        className="font-semibold text-center truncate w-full"
        style={{ color: preset.color, fontSize: Math.min(preset.fontSize / 2, 18) }}
      >
        {preset.preview}
      </div>
      <div className="text-[10px] text-gray-500">{preset.label}</div>
    </button>
  );
}
