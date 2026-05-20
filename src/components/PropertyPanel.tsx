import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { Engine } from '../engine';
import {
  MoveElementCommand,
  UpdatePageCommand,
  SetPageKindCommand,
  UpdatePageVideoCommand,
} from '../engine';
import { useStores, useSelectionStore, useSceneStore } from '../store';
import type {
  Element,
  ShapeElement,
  TextElement,
  ImageElement,
  PageBackground,
  VideoPageConfig,
  Page,
} from '../types';

interface PropertyPanelProps {
  engine: Engine;
}

export default function PropertyPanel({ engine }: PropertyPanelProps) {
  const { selectionStore, sceneStore } = useStores();
  const selectionSnapshot = useSelectionStore(selectionStore);
  const sceneSnapshot = useSceneStore(sceneStore);
  const selectedIds = selectionSnapshot.selectedIds;
  const element =
    selectedIds.length > 0 ? sceneStore.getElement(selectionSnapshot.firstSelectedId ?? '') : null;
  const currentPage = sceneSnapshot.currentPage;
  const documentBg = sceneSnapshot.document.background;

  const commitElement = useCallback(
    (updates: Record<string, unknown>) => {
      if (!element) return;
      engine.execute(
        new MoveElementCommand(
          engine.scene,
          element.id,
          updates as Partial<Omit<Element, 'id' | 'type'>>,
        ),
      );
    },
    [engine, element?.id],
  );

  const commitPage = useCallback(
    (updates: Record<string, unknown>) => {
      if (!currentPage) return;
      engine.execute(
        new UpdatePageCommand(
          engine.scene,
          currentPage.id,
          updates as Partial<Omit<typeof currentPage, 'id'>>,
        ),
      );
    },
    [engine, currentPage?.id],
  );

  if (selectedIds.length === 0) {
    if (!currentPage) return null;
    const hasCustomBg = currentPage.background !== undefined;
    const bg: PageBackground = currentPage.background ?? documentBg;
    const isVideoPage = currentPage.kind === 'video';
    return (
      <div className="w-[400px] h-full bg-gray-50 p-4 overflow-y-auto box-border">
        <h3 className="m-0 mb-4 text-sm text-gray-700">
          {isVideoPage ? 'Video Page' : 'Current Page'}
        </h3>

        <Section title="General">
          <TextField
            label="Name"
            value={currentPage.name}
            onCommit={(v) => commitPage({ name: v })}
          />
          <PageKindToggle engine={engine} page={currentPage} />
        </Section>

        {isVideoPage && <VideoPageFields engine={engine} page={currentPage} />}

        {!isVideoPage && (
          <Section title="Background">
            <label className="flex items-center gap-2 text-xs text-gray-600 mb-2.5 cursor-pointer">
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
                className="cursor-pointer"
              />
              Custom background
            </label>

            {hasCustomBg ? (
              <PageBackgroundEditor
                background={bg}
                onCommit={(bg) => commitPage({ background: bg })}
              />
            ) : (
              <div className="text-xs text-gray-400">Using global background</div>
            )}
          </Section>
        )}
      </div>
    );
  }

  if (!element) return null;

  return (
    <div className="w-[400px] h-full bg-gray-50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="m-0 text-sm text-gray-700">Properties</h3>
        {element.source === 'ai' && (
          <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
            🤖 AI Generated
          </span>
        )}
      </div>

      <Section title="Transform">
        <NumberField label="X" value={element.x} onCommit={(v) => commitElement({ x: v })} />
        <NumberField label="Y" value={element.y} onCommit={(v) => commitElement({ y: v })} />
        <NumberField
          label="Width"
          value={element.width}
          onCommit={(v) => commitElement({ width: v })}
        />
        <NumberField
          label="Height"
          value={element.height}
          onCommit={(v) => commitElement({ height: v })}
        />
        <NumberField
          label="Rotation"
          value={element.rotation}
          onCommit={(v) => commitElement({ rotation: v })}
        />
        <NumberField
          label="Opacity"
          value={element.opacity}
          min={0}
          max={1}
          step={0.1}
          onCommit={(v) => commitElement({ opacity: v })}
        />
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
    <div className="mb-5">
      <h4 className="m-0 mb-2.5 text-xs text-gray-500 uppercase tracking-[0.5px]">{title}</h4>
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
      <textarea
        value={local}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLocal(e.target.value)}
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
      <NumberField
        label="Stroke W"
        value={element.strokeWidth}
        min={0}
        onCommit={(v) => onCommit({ strokeWidth: v })}
      />
      {isRoundedRect && (
        <NumberField
          label="Radius"
          value={element.cornerRadius ?? 0}
          min={0}
          onCommit={(v) => onCommit({ cornerRadius: v })}
        />
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
      <NumberField
        label="Font Size"
        value={element.fontSize}
        min={1}
        onCommit={(v) => onCommit({ fontSize: v })}
      />
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

function PageKindToggle({ engine, page }: { engine: Engine; page: Page }) {
  const kind = page.kind ?? 'normal';
  const handleChange = (next: 'normal' | 'video') => {
    if (next === kind) return;
    engine.execute(new SetPageKindCommand(engine.scene, page.id, next));
  };
  return (
    <SelectField
      label="Kind"
      value={kind}
      options={[
        { label: 'Normal', value: 'normal' },
        { label: 'Video', value: 'video' },
      ]}
      onCommit={(v) => handleChange(v as 'normal' | 'video')}
    />
  );
}

function VideoPageFields({ engine, page }: { engine: Engine; page: Page }) {
  const video: VideoPageConfig = page.video ?? { src: '' };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commit = (patch: Partial<VideoPageConfig>): void => {
    engine.execute(new UpdatePageVideoCommand(engine.scene, page.id, patch));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    commit({ src: url, duration: undefined });
  };

  return (
    <Section title="Video">
      <TextField
        label="Src"
        value={video.src}
        onCommit={(v) => commit({ src: v, duration: undefined })}
      />
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="w-[60px] shrink-0">Upload</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 text-xs border border-gray-300 rounded bg-white cursor-pointer"
        >
          选择本地视频
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>
      <BoolField
        label="Autoplay"
        value={!!video.autoplay}
        onCommit={(v) => commit({ autoplay: v })}
      />
      <BoolField label="Muted" value={!!video.muted} onCommit={(v) => commit({ muted: v })} />
      <BoolField label="Loop" value={!!video.loop} onCommit={(v) => commit({ loop: v })} />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <span className="w-[60px] shrink-0">Duration</span>
        <span className="flex-1 px-2 py-1 text-xs text-gray-500">
          {video.duration !== undefined ? `${video.duration.toFixed(2)} s` : '—'}
        </span>
      </label>
    </Section>
  );
}

function BoolField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: boolean;
  onCommit: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-[60px] shrink-0">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onCommit(e.target.checked)}
        className="cursor-pointer"
      />
    </label>
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
        newBg = {
          type: 'gradient',
          angle: 135,
          stops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#8b5cf6' },
          ],
        };
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
    <div className="flex flex-col gap-2.5">
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
        <ColorField
          label="Color"
          value={background.color}
          onCommit={(v) => onCommit({ type: 'solid', color: v })}
        />
      )}

      {background.type === 'gradient' && (
        <>
          <NumberField
            label="Angle"
            value={background.angle}
            onCommit={(v) => onCommit({ ...background, angle: v })}
          />
          <ColorField
            label="Start"
            value={background.stops[0]?.color ?? '#3b82f6'}
            onCommit={(v) =>
              onCommit({
                ...background,
                stops: [
                  { offset: 0, color: v },
                  { offset: 1, color: background.stops[1]?.color ?? '#8b5cf6' },
                ],
              })
            }
          />
          <ColorField
            label="End"
            value={background.stops[1]?.color ?? '#8b5cf6'}
            onCommit={(v) =>
              onCommit({
                ...background,
                stops: [
                  { offset: 0, color: background.stops[0]?.color ?? '#3b82f6' },
                  { offset: 1, color: v },
                ],
              })
            }
          />
        </>
      )}

      {background.type === 'image' && (
        <>
          <TextField
            label="Src"
            value={background.src}
            onCommit={(v) => onCommit({ ...background, src: v })}
          />
          <SelectField
            label="Fit"
            value={background.fit}
            options={[
              { label: 'Cover', value: 'cover' },
              { label: 'Contain', value: 'contain' },
              { label: 'Fill', value: 'fill' },
            ]}
            onCommit={(v) =>
              onCommit({
                ...background,
                fit: v as PageBackground extends { type: 'image' } ? typeof background.fit : never,
              })
            }
          />
          <NumberField
            label="Opacity"
            value={background.opacity}
            min={0}
            max={1}
            step={0.1}
            onCommit={(v) => onCommit({ ...background, opacity: v })}
          />
        </>
      )}
    </div>
  );
}
