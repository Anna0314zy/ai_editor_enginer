import { useState, useEffect, useRef } from 'react';
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
      { label: 'Octagon', shapeType: 'octagon', icon: <svg width="16" height="16" viewBox="0 0 18 18"><polygon points="5.5,1 12.5,1 17,5.5 17,12.5 12.5,17 5.5,17 1,12.5 1,5.5" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg> },
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

interface ToolbarItem {
  label: string;
  type: 'shape' | 'text' | 'image';
  shapeType?: string;
  icon: string;
}

const nonShapeItems: ToolbarItem[] = [
  { label: 'Text', type: 'text', icon: 'T' },
  { label: 'Image', type: 'image', icon: '🖼' },
];

interface CanvasToolbarProps {
  engine: Engine;
}

export default function CanvasToolbar({ engine }: CanvasToolbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pluginComponents = engine.pluginRegistry.getComponents();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, type: string, shapeType?: string): void => {
    const data = JSON.stringify({ type, shapeType });
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
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            padding: '6px 12px',
            backgroundColor: open ? '#e5e7eb' : '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#4b5563',
            fontWeight: 600,
          }}
        >
          <span>Shapes</span>
          <span style={{ fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              zIndex: 100,
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 200,
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
                  }}
                >
                  {group.label}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
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

      {pluginComponents.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => handleDragStart(e, item.type)}
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
