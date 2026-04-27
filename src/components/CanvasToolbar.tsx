import type { DragEvent } from 'react';

interface ToolbarItem {
  label: string;
  type: 'shape' | 'text' | 'image';
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  icon: string;
}

const items: ToolbarItem[] = [
  { label: 'Rectangle', type: 'shape', shapeType: 'rectangle', icon: '□' },
  { label: 'Circle', type: 'shape', shapeType: 'circle', icon: '○' },
  { label: 'Triangle', type: 'shape', shapeType: 'triangle', icon: '△' },
  { label: 'Text', type: 'text', icon: 'T' },
  { label: 'Image', type: 'image', icon: '🖼' },
];

export default function CanvasToolbar() {
  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: ToolbarItem): void => {
    const data = JSON.stringify({
      type: item.type,
      shapeType: item.shapeType,
    });
    e.dataTransfer.setData('application/json', data);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      style={{
        height: 48,
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#4b5563',
          }}
        >
          <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
