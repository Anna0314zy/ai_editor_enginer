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
    <div className="w-[200px] h-full border-r border-gray-200 bg-gray-50 p-4 flex flex-col gap-3 select-none overflow-y-auto">
      <h3 className="m-0 mb-2 text-sm text-gray-700">Components</h3>

      <div>
        <div
          onClick={() => setShapeOpen(!shapeOpen)}
          className="px-3 py-2.5 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center justify-between text-[13px] text-gray-600 font-semibold"
        >
          <span className="flex items-center gap-2.5">
            <span className="text-lg w-6 text-center">▣</span>
            <span>Shapes</span>
          </span>
          <span className="text-[10px] text-gray-400">{shapeOpen ? '▼' : '▶'}</span>
        </div>

        {shapeOpen && (
          <div className="mt-2 flex flex-col gap-2.5 pl-1">
            {shapeGroups.map((group) => (
              <div key={group.label}>
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.5px] mb-1.5 font-semibold pl-2">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1.5 pl-2">
                  {group.items.map((item) => (
                    <div
                      key={item.label}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'shape', item.shapeType)}
                      title={item.label}
                      className="w-9 h-9 flex items-center justify-center bg-white border border-gray-300 rounded cursor-grab text-lg text-gray-600"
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
          className="px-3 py-2.5 bg-white border border-gray-300 rounded-md cursor-grab flex items-center gap-2.5 text-[13px] text-gray-600"
        >
          <span className="text-lg w-6 text-center">{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      {pluginComponents.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-[0.5px] mb-1.5 font-semibold pl-1">
            Plugins
          </div>
          {pluginComponents.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => handleDragStart(e, item.type)}
              className="px-3 py-2.5 bg-white border border-gray-300 rounded-md cursor-grab flex items-center gap-2.5 text-[13px] text-gray-600 mb-2"
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
