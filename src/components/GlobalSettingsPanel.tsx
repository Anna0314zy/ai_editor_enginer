import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { Engine } from '../engine';
import { useStores, useSceneStore } from '../store';
import type { PageBackground, SafeArea } from '../types';

interface GlobalSettingsPanelProps {
  engine: Engine;
}

const SAFE_AREA_PRESETS: { label: string; value: string; area: SafeArea }[] = [
  { label: 'None', value: 'none', area: { top: 0, right: 0, bottom: 0, left: 0 } },
  { label: 'Standard (20px)', value: 'standard', area: { top: 20, right: 20, bottom: 20, left: 20 } },
  { label: 'Wide (40px)', value: 'wide', area: { top: 40, right: 40, bottom: 40, left: 40 } },
  { label: 'Action Safe (5%)', value: 'action', area: { top: 27, right: 48, bottom: 27, left: 48 } },
];

function getPresetValueForSafeArea(area: SafeArea): string {
  for (const preset of SAFE_AREA_PRESETS) {
    if (
      preset.area.top === area.top &&
      preset.area.right === area.right &&
      preset.area.bottom === area.bottom &&
      preset.area.left === area.left
    ) {
      return preset.value;
    }
  }
  return 'custom';
}

export default function GlobalSettingsPanel({ engine }: GlobalSettingsPanelProps) {
  const { sceneStore } = useStores();
  const sceneSnapshot = useSceneStore(sceneStore);
  const background = sceneSnapshot.document.background;
  const safeArea = sceneSnapshot.document.safeArea;

  const commitBackground = useCallback(
    (bg: PageBackground) => {
      engine.updateDocumentBackground(bg);
    },
    [engine]
  );

  const commitSafeArea = useCallback(
    (area: SafeArea) => {
      engine.updateDocumentSafeArea(area);
    },
    [engine]
  );

  const handleBackgroundTypeChange = (type: PageBackground['type']) => {
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
    commitBackground(newBg);
  };

  const presetValue = getPresetValueForSafeArea(safeArea);

  return (
    <div className="h-full bg-gray-50 p-4 overflow-y-auto">
      <h3 className="m-0 mb-4 text-sm text-gray-700">Global Settings</h3>
      <p className="m-0 mb-4 text-[11px] text-gray-400">These settings apply to all pages.</p>

      <Section title="Background">
        <SelectField
          label="Type"
          value={background.type}
          options={[
            { label: 'Solid', value: 'solid' },
            { label: 'Gradient', value: 'gradient' },
            { label: 'Image', value: 'image' },
          ]}
          onCommit={(v) => handleBackgroundTypeChange(v as PageBackground['type'])}
        />

        {background.type === 'solid' && (
          <ColorField label="Color" value={background.color} onCommit={(v) => commitBackground({ type: 'solid', color: v })} />
        )}

        {background.type === 'gradient' && (
          <>
            <NumberField label="Angle" value={background.angle} onCommit={(v) => commitBackground({ ...background, angle: v })} />
            <ColorField
              label="Start"
              value={background.stops[0]?.color ?? '#3b82f6'}
              onCommit={(v) =>
                commitBackground({
                  ...background,
                  stops: [{ offset: 0, color: v }, { offset: 1, color: background.stops[1]?.color ?? '#8b5cf6' }],
                })
              }
            />
            <ColorField
              label="End"
              value={background.stops[1]?.color ?? '#8b5cf6'}
              onCommit={(v) =>
                commitBackground({
                  ...background,
                  stops: [{ offset: 0, color: background.stops[0]?.color ?? '#3b82f6' }, { offset: 1, color: v }],
                })
              }
            />
          </>
        )}

        {background.type === 'image' && (
          <>
            <TextField label="Src" value={background.src} onCommit={(v) => commitBackground({ ...background, src: v })} />
            <SelectField
              label="Fit"
              value={background.fit}
              options={[
                { label: 'Cover', value: 'cover' },
                { label: 'Contain', value: 'contain' },
                { label: 'Fill', value: 'fill' },
              ]}
              onCommit={(v) => commitBackground({ ...background, fit: v as PageBackground['type'] extends 'image' ? typeof background.fit : never })}
            />
            <NumberField label="Opacity" value={background.opacity} min={0} max={1} step={0.1} onCommit={(v) => commitBackground({ ...background, opacity: v })} />
          </>
        )}
      </Section>

      <Section title="Safe Area">
        <SelectField
          label="Preset"
          value={presetValue}
          options={[
            ...SAFE_AREA_PRESETS.map((p) => ({ label: p.label, value: p.value })),
            { label: 'Custom', value: 'custom' },
          ]}
          onCommit={(v) => {
            const preset = SAFE_AREA_PRESETS.find((p) => p.value === v);
            if (preset) {
              commitSafeArea(preset.area);
            }
          }}
        />
        <NumberField label="Top" value={safeArea.top} min={0} onCommit={(v) => commitSafeArea({ ...safeArea, top: v })} />
        <NumberField label="Right" value={safeArea.right} min={0} onCommit={(v) => commitSafeArea({ ...safeArea, right: v })} />
        <NumberField label="Bottom" value={safeArea.bottom} min={0} onCommit={(v) => commitSafeArea({ ...safeArea, bottom: v })} />
        <NumberField label="Left" value={safeArea.left} min={0} onCommit={(v) => commitSafeArea({ ...safeArea, left: v })} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="m-0 mb-2.5 text-xs text-gray-500 uppercase tracking-[0.5px]">
        {title}
      </h4>
      <div className="flex flex-col gap-2.5">{children}</div>
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
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-[60px] shrink-0">{label}</span>
      <input
        type="number"
        value={local}
        min={min}
        max={max}
        step={step}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
        onBlur={handleBlur}
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
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
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-[60px] shrink-0">{label}</span>
      <input
        type="text"
        value={local}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
        onBlur={handleBlur}
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
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
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-[60px] shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCommit(e.target.value)}
          className="w-7 h-7 p-0 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCommit(e.target.value)}
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
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
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-[60px] shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onCommit(e.target.value)}
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
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
