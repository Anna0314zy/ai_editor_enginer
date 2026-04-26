import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { Engine } from '../engine';
import { MoveElementCommand } from '../engine';
import type { Element, ShapeElement, TextElement, ImageElement } from '../types';

interface PropertyPanelProps {
  engine: Engine;
  onRefresh: () => void;
}

export default function PropertyPanel({ engine, onRefresh }: PropertyPanelProps) {
  const selectedIds = engine.getEditorState().selectedElementIds;

  if (selectedIds.length === 0) {
    return (
      <div
        style={{
          width: 400,
          height: '100%',
          backgroundColor: '#f9fafb',
          padding: 16,
          color: '#9ca3af',
          fontSize: 13,
        }}
      >
        Select an element to edit properties
      </div>
    );
  }

  const element = engine.scene.getElement(selectedIds[0]);
  if (!element) return null;

  const commit = useCallback(
    (updates: Record<string, unknown>) => {
      engine.execute(new MoveElementCommand(engine.scene, element.id, updates as Partial<Omit<Element, 'id' | 'type'>>));
      onRefresh();
    },
    [engine, element.id, onRefresh]
  );

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
      <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Properties</h3>

      <Section title="Transform">
        <NumberField label="X" value={element.x} onCommit={(v) => commit({ x: v })} />
        <NumberField label="Y" value={element.y} onCommit={(v) => commit({ y: v })} />
        <NumberField label="Width" value={element.width} onCommit={(v) => commit({ width: v })} />
        <NumberField label="Height" value={element.height} onCommit={(v) => commit({ height: v })} />
        <NumberField label="Rotation" value={element.rotation} onCommit={(v) => commit({ rotation: v })} />
        <NumberField label="Opacity" value={element.opacity} min={0} max={1} step={0.1} onCommit={(v) => commit({ opacity: v })} />
      </Section>

      {element.type === 'shape' && (
        <ShapeFields element={element as ShapeElement} onCommit={commit} />
      )}

      {element.type === 'text' && (
        <TextFields element={element as TextElement} onCommit={commit} />
      )}

      {element.type === 'image' && (
        <ImageFields element={element as ImageElement} onCommit={commit} />
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
  return (
    <Section title="Shape">
      <SelectField
        label="Type"
        value={element.shapeType}
        options={[
          { label: 'Rectangle', value: 'rectangle' },
          { label: 'Circle', value: 'circle' },
          { label: 'Triangle', value: 'triangle' },
        ]}
        onCommit={(v) => onCommit({ shapeType: v as ShapeElement['shapeType'] })}
      />
      <ColorField label="Fill" value={element.fill} onCommit={(v) => onCommit({ fill: v })} />
      <ColorField label="Stroke" value={element.stroke} onCommit={(v) => onCommit({ stroke: v })} />
      <NumberField label="Stroke W" value={element.strokeWidth} min={0} onCommit={(v) => onCommit({ strokeWidth: v })} />
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
