import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { Engine } from '../engine';
import { MoveElementCommand, UpdatePageCommand } from '../engine';
import { useStores, useSelectionStore, useSceneStore } from '../store';
import type { Element, ShapeElement, TextElement, ImageElement, PageBackground } from '../types';

interface PropertyPanelProps {
  engine: Engine;
}

export default function PropertyPanel({ engine }: PropertyPanelProps) {
  const { selectionStore, sceneStore } = useStores();
  const selectionSnapshot = useSelectionStore(selectionStore);
  const sceneSnapshot = useSceneStore(sceneStore);
  const selectedIds = selectionSnapshot.selectedIds;
  const element = selectedIds.length > 0 ? sceneStore.getElement(selectionSnapshot.firstSelectedId ?? '') : null;
  const currentPage = sceneSnapshot.currentPage;
  const documentBg = sceneSnapshot.document.background;

  const commitElement = useCallback(
    (updates: Record<string, unknown>) => {
      if (!element) return;
      engine.execute(new MoveElementCommand(engine.scene, element.id, updates as Partial<Omit<Element, 'id' | 'type'>>));
    },
    [engine, element?.id]
  );

  const commitPage = useCallback(
    (updates: Record<string, unknown>) => {
      if (!currentPage) return;
      engine.execute(new UpdatePageCommand(engine.scene, currentPage.id, updates as Partial<Omit<typeof currentPage, 'id'>>));
    },
    [engine, currentPage?.id]
  );

  if (selectedIds.length === 0) {
    if (!currentPage) return null;
    const hasCustomBg = currentPage.background !== undefined;
    const bg: PageBackground = currentPage.background ?? documentBg;
    return (
      <div
        style={{
          width: 400,
          height: '100%',
          backgroundColor: '#f9fafb',
          padding: 16,
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Current Page</h3>

        <Section title="General">
          <TextField label="Name" value={currentPage.name} onCommit={(v) => commitPage({ name: v })} />
        </Section>

        <Section title="Background">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#4b5563',
              marginBottom: 10,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={hasCustomBg}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  commitPage({ background: documentBg });
                } else {
                  commitPage({ background: undefined });
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            Custom background
          </label>

          {hasCustomBg ? (
            <PageBackgroundEditor background={bg} onCommit={(bg) => commitPage({ background: bg })} />
          ) : (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Using global background</div>
          )}
        </Section>
      </div>
    );
  }

  if (!element) return null;

  return (
    <div
      style={{
        width: 400,
        height: '100%',
        backgroundColor: '#f9fafb',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: '#374151' }}>Properties</h3>
        {element.source === 'ai' && (
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            🤖 AI Generated
          </span>
        )}
      </div>

      <Section title="Transform">
        <NumberField label="X" value={element.x} onCommit={(v) => commitElement({ x: v })} />
        <NumberField label="Y" value={element.y} onCommit={(v) => commitElement({ y: v })} />
        <NumberField label="Width" value={element.width} onCommit={(v) => commitElement({ width: v })} />
        <NumberField label="Height" value={element.height} onCommit={(v) => commitElement({ height: v })} />
        <NumberField label="Rotation" value={element.rotation} onCommit={(v) => commitElement({ rotation: v })} />
        <NumberField label="Opacity" value={element.opacity} min={0} max={1} step={0.1} onCommit={(v) => commitElement({ opacity: v })} />
      </Section>

      {element.type === 'shape' && (
        <ShapeFields element={element as ShapeElement} onCommit={commitElement} />
      )}

      {element.type === 'text' && (
        <TextFields element={element as TextElement} onCommit={commitElement} />
      )}

      {element.type === 'image' && (
        <ImageFields element={element as ImageElement} onCommit={commitElement} />
      )}
    </div>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h4 style={{ margin: '0 0 10px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const handleBlur = (): void => {
    const n = Number(local);
    if (!Number.isNaN(n)) {
      onCommit(n);
    } else {
      setLocal(String(value));
    }
  };

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 60, flexShrink: 0 }}>{label}</span>
      <input
        type="number"
        value={local}
        min={min}
        max={max}
        step={step}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
        onBlur={handleBlur}
        style={{
          flex: 1,
          padding: '4px 8px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: 12,
          backgroundColor: '#ffffff',
        }}
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleBlur = (): void => {
    onCommit(local);
  };

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 60, flexShrink: 0 }}>{label}</span>
      <input
        type="text"
        value={local}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
        onBlur={handleBlur}
        style={{
          flex: 1,
          padding: '4px 8px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: 12,
          backgroundColor: '#ffffff',
        }}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 60, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <input
          type="color"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCommit(e.target.value)}
          style={{ width: 28, height: 28, padding: 0, border: '1px solid #d1d5db', borderRadius: 4, cursor: 'pointer' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCommit(e.target.value)}
          style={{
            flex: 1,
            padding: '4px 8px',
            border: '1px solid #d1d5db',
            borderRadius: 4,
            fontSize: 12,
            backgroundColor: '#ffffff',
          }}
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onCommit,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onCommit: (v: string) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 60, flexShrink: 0 }}>{label}</span>
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onCommit(e.target.value)}
        style={{
          flex: 1,
          padding: '4px 8px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: 12,
          backgroundColor: '#ffffff',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ShapeFields({
  element,
  onCommit,
}: {
  element: ShapeElement;
  onCommit: (updates: Record<string, unknown>) => void;
}) {
  const isRoundedRect = element.shapeType === 'rounded-rectangle';

  return (
    <Section title="Shape">
      <SelectField
        label="Type"
        value={element.shapeType}
        options={[
          { label: 'Rectangle', value: 'rectangle' },
          { label: 'Rounded Rectangle', value: 'rounded-rectangle' },
          { label: 'Circle', value: 'circle' },
          { label: 'Triangle', value: 'triangle' },
          { label: 'Line', value: 'line' },
          { label: 'Arrow', value: 'arrow' },
          { label: 'Pentagon', value: 'pentagon' },
          { label: 'Hexagon', value: 'hexagon' },
          { label: 'Octagon', value: 'octagon' },
          { label: 'Star 5', value: 'star-5' },
          { label: 'Star 6', value: 'star-6' },
        ]}
        onCommit={(v) => onCommit({ shapeType: v as ShapeElement['shapeType'] })}
      />
      <ColorField label="Fill" value={element.fill} onCommit={(v) => onCommit({ fill: v })} />
      <ColorField label="Stroke" value={element.stroke} onCommit={(v) => onCommit({ stroke: v })} />
      <NumberField label="Stroke W" value={element.strokeWidth} min={0} onCommit={(v) => onCommit({ strokeWidth: v })} />
      {isRoundedRect && (
        <NumberField label="Radius" value={element.cornerRadius ?? 0} min={0} onCommit={(v) => onCommit({ cornerRadius: v })} />
      )}
    </Section>
  );
}

function TextFields({
  element,
  onCommit,
}: {
  element: TextElement;
  onCommit: (updates: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Text">
      <TextField label="Content" value={element.text} onCommit={(v) => onCommit({ text: v })} />
      <NumberField label="Font Size" value={element.fontSize} min={1} onCommit={(v) => onCommit({ fontSize: v })} />
      <ColorField label="Color" value={element.color} onCommit={(v) => onCommit({ color: v })} />
      <SelectField
        label="Align"
        value={element.align}
        options={[
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ]}
        onCommit={(v) => onCommit({ align: v as TextElement['align'] })}
      />
    </Section>
  );
}

function ImageFields({
  element,
  onCommit,
}: {
  element: ImageElement;
  onCommit: (updates: Record<string, unknown>) => void;
}) {
  return (
    <Section title="Image">
      <TextField label="Src" value={element.src} onCommit={(v) => onCommit({ src: v })} />
      <SelectField
        label="Fit"
        value={element.objectFit}
        options={[
          { label: 'Cover', value: 'cover' },
          { label: 'Contain', value: 'contain' },
          { label: 'Fill', value: 'fill' },
        ]}
        onCommit={(v) => onCommit({ objectFit: v as ImageElement['objectFit'] })}
      />
    </Section>
  );
}

function PageBackgroundEditor({
  background,
  onCommit,
}: {
  background: PageBackground;
  onCommit: (bg: PageBackground) => void;
}) {
  const handleTypeChange = (type: PageBackground['type']) => {
    if (background.type === type) return;
    let newBg: PageBackground;
    switch (type) {
      case 'solid':
        newBg = { type: 'solid', color: '#ffffff' };
        break;
      case 'gradient':
        newBg = { type: 'gradient', angle: 135, stops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#8b5cf6' }] };
        break;
      case 'image':
        newBg = { type: 'image', src: '', fit: 'cover', opacity: 1 };
        break;
      default:
        newBg = { type: 'solid', color: '#ffffff' };
    }
    onCommit(newBg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SelectField
        label="Type"
        value={background.type}
        options={[
          { label: 'Solid', value: 'solid' },
          { label: 'Gradient', value: 'gradient' },
          { label: 'Image', value: 'image' },
        ]}
        onCommit={(v) => handleTypeChange(v as PageBackground['type'])}
      />

      {background.type === 'solid' && (
        <ColorField label="Color" value={background.color} onCommit={(v) => onCommit({ type: 'solid', color: v })} />
      )}

      {background.type === 'gradient' && (
        <>
          <NumberField label="Angle" value={background.angle} onCommit={(v) => onCommit({ ...background, angle: v })} />
          <ColorField
            label="Start"
            value={background.stops[0]?.color ?? '#3b82f6'}
            onCommit={(v) =>
              onCommit({
                ...background,
                stops: [{ offset: 0, color: v }, { offset: 1, color: background.stops[1]?.color ?? '#8b5cf6' }],
              })
            }
          />
          <ColorField
            label="End"
            value={background.stops[1]?.color ?? '#8b5cf6'}
            onCommit={(v) =>
              onCommit({
                ...background,
                stops: [{ offset: 0, color: background.stops[0]?.color ?? '#3b82f6' }, { offset: 1, color: v }],
              })
            }
          />
        </>
      )}

      {background.type === 'image' && (
        <>
          <TextField label="Src" value={background.src} onCommit={(v) => onCommit({ ...background, src: v })} />
          <SelectField
            label="Fit"
            value={background.fit}
            options={[
              { label: 'Cover', value: 'cover' },
              { label: 'Contain', value: 'contain' },
              { label: 'Fill', value: 'fill' },
            ]}
            onCommit={(v) => onCommit({ ...background, fit: v as PageBackground extends { type: 'image' } ? typeof background.fit : never })}
          />
          <NumberField label="Opacity" value={background.opacity} min={0} max={1} step={0.1} onCommit={(v) => onCommit({ ...background, opacity: v })} />
        </>
      )}
    </div>
  );
}
