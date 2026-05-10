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
    <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-2 shrink-0">
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`px-3 py-1.5 border border-gray-300 rounded cursor-pointer flex items-center gap-1.5 text-xs text-gray-600 font-semibold ${
            open ? 'bg-gray-200' : 'bg-gray-50'
          }`}
        >
          <span>Shapes</span>
          <span className="text-[10px]">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="absolute top-[calc(100%+4px)] left-0 z-[100] bg-white border border-gray-300 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-3 flex flex-col gap-3 min-w-[200px]">
            {shapeGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.5px] mb-1.5 font-semibold">
                  {group.label}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'shape', item.shapeType)}
                      title={item.label}
                      className="w-9 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 rounded cursor-grab text-lg text-gray-600"
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
          className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded cursor-grab flex items-center gap-1.5 text-xs text-gray-600"
        >
          <span className="text-base w-5 text-center">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      {pluginComponents.map((item) => (
        <div
          key={item.type}
          draggable
          onDragStart={(e) => handleDragStart(e, item.type)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded cursor-grab flex items-center gap-1.5 text-xs text-gray-600"
        >
          <span className="text-base w-5 text-center">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
