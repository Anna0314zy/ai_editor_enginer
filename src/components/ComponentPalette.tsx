import type { DragEvent } from 'react';

interface PaletteItem {
  label: string;
  type: 'shape' | 'text' | 'image';
  shapeType?: 'rectangle' | 'circle' | 'triangle';
  icon: string;
}

const items: PaletteItem[] = [
  { label: 'Rectangle', type: 'shape', shapeType: 'rectangle', icon: '□' },
  { label: 'Circle', type: 'shape', shapeType: 'circle', icon: '○' },
  { label: 'Triangle', type: 'shape', shapeType: 'triangle', icon: '△' },
  { label: 'Text', type: 'text', icon: 'T' },
  { label: 'Image', type: 'image', icon: '🖼' },
];

export default function ComponentPalette() {
  const handleDragStart = (e: DragEvent<HTMLDivElement>, item: PaletteItem): void => {
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
        width: 200,
        height: '100%',
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        userSelect: 'none',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#374151' }}>Components</h3>
      {items.map((item) => (
        <div
          key={item.label}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          style={{
            padding: '10px 12px',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#4b5563',
          }}
        >
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
