import { useState } from 'react';
import type { DragEvent, ReactNode } from 'react';
import type { Engine } from '../engine';

interface ShapeItem {
  label: string;
  shapeType: string;
  icon: ReactNode;
}

interface ShapeGroup {
  label: string;
  items: ShapeItem[];
}

const shapeGroups: ShapeGroup[] = [
  {
    label: 'Basic',
    items: [
      { label: 'Rectangle', shapeType: 'rectangle', icon: '□' },
      { label: 'Rounded Rect', shapeType: 'rounded-rectangle', icon: '▢' },
      { label: 'Circle', shapeType: 'circle', icon: '○' },
      { label: 'Triangle', shapeType: 'triangle', icon: '△' },
    ],
  },
  {
    label: 'Lines',
    items: [
      { label: 'Line', shapeType: 'line', icon: '─' },
      { label: 'Arrow', shapeType: 'arrow', icon: '→' },
    ],
  },
  {
    label: 'Polygons',
    items: [
      { label: 'Pentagon', shapeType: 'pentagon', icon: '⬠' },
      { label: 'Hexagon', shapeType: 'hexagon', icon: '⬡' },
      { label: 'Octagon', shapeType: 'octagon', icon: <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="5.5,1 12.5,1 17,5.5 17,12.5 12.5,17 5.5,17 1,12.5 1,5.5" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg> },
    ],
  },
  {
    label: 'Stars',
    items: [
      { label: 'Star 5', shapeType: 'star-5', icon: '★' },
      { label: 'Star 6', shapeType: 'star-6', icon: '✶' },
    ],
  },
];

interface PaletteItem {
  label: string;
  type: string;
  shapeType?: string;
  icon: ReactNode;
}

const nonShapeItems: PaletteItem[] = [
  { label: 'Text', type: 'text', icon: 'T' },
  { label: 'Image', type: 'image', icon: '🖼' },
];

interface ComponentPaletteProps {
  engine: Engine;
}

export default function ComponentPalette({ engine }: ComponentPaletteProps) {
  const [shapeOpen, setShapeOpen] = useState(true);
  const pluginComponents = engine.pluginRegistry.getComponents();

  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: string, shapeType?: string): void => {
    const data = JSON.stringify({ type, shapeType });
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
        overflowY: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#374151' }}>Components</h3>

      <div>
        <div
          onClick={() => setShapeOpen(!shapeOpen)}
          style={{
            padding: '10px 12px',
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#4b5563',
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>▣</span>
            <span>Shapes</span>
          </span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{shapeOpen ? '▼' : '▶'}</span>
        </div>

        {shapeOpen && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingLeft: 4,
            }}
          >
            {shapeGroups.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    fontSize: 10,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    fontWeight: 600,
                    paddingLeft: 8,
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 8 }}>
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'shape', item.shapeType)}
                      title={item.label}
                      style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        cursor: 'grab',
                        fontSize: 18,
                        color: '#4b5563',
                      }}
                    >
                      {item.icon}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {nonShapeItems.map((item) => (
        <div
          key={item.label}
          draggable
          onDragStart={(e) => handleDragStart(e, item.type, item.shapeType)}
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

      {pluginComponents.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 10,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 6,
              fontWeight: 600,
              paddingLeft: 4,
            }}
          >
            Plugins
          </div>
          {pluginComponents.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
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
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
