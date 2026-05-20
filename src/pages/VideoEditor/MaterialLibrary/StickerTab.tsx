import { useDraggable } from '@dnd-kit/core';
import { useVideoTimeline } from '../timeline/VideoTimelineContext';
import { createStickerClip } from '../../../components/TimelinePanel/clipFactory';
import { placeSticker } from '../timeline/timelineRules';

// ============================================================================
// StickerTab - 示例贴纸库（emoji 占位）。点击或拖拽插入到 sticker 轨。
// ============================================================================

const STICKERS = ['❤️', '🔥', '✨', '⭐', '👍', '🎉', '😀', '🚀', '🎬', '💡', '👀', '🌟'];

export default function StickerTab() {
  const { timeline, timelineStore } = useVideoTimeline();

  const handleAdd = (emoji: string) => {
    const currentTime = timelineStore.getSnapshot().currentTime;
    const clip = createStickerClip({
      startTime: currentTime,
      name: `贴纸 ${emoji}`,
    });
    const placed = placeSticker({ timeline, dropTime: currentTime }, clip);
    if (placed) timelineStore.selectClip(placed.id);
  };

  return (
    <div className="p-3 grid grid-cols-4 gap-2">
      {STICKERS.map((s, i) => (
        <DraggableSticker key={`${s}-${i}`} emoji={s} index={i} onAdd={() => handleAdd(s)} />
      ))}
    </div>
  );
}

function DraggableSticker({
  emoji,
  index,
  onAdd,
}: {
  emoji: string;
  index: number;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `sticker-${index}-${emoji}`,
    data: {
      kind: 'sticker',
      payload: { name: `贴纸 ${emoji}`, emoji },
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
      title={`添加贴纸 ${emoji}`}
      className={`aspect-square rounded bg-gray-900 border border-gray-800 hover:border-blue-500 cursor-grab active:cursor-grabbing flex items-center justify-center text-2xl ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {emoji}
    </button>
  );
}
