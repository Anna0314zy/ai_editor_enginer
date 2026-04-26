import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Engine } from '../engine';
import {
  AddAnimationCommand,
  RemoveAnimationCommand,
  UpdateAnimationCommand,
  ReorderAnimationsCommand,
} from '../engine';
import type { AnimationEngine } from '../animation';
import { buildClickSteps } from '../animation';
import type {
  AnimationConfig,
  AnimationEffect,
  AnimationType,
  StartType,
  EasingPreset,
  SlideDirection,
} from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AnimationPanelProps {
  engine: Engine;
  animationEngine: AnimationEngine;
  onRefresh: () => void;
}

let animIdCounter = 0;
function uid(): string {
  return `anim-${Date.now()}-${animIdCounter++}`;
}

const ENTER_EFFECTS: AnimationEffect[] = ['fadeIn', 'zoomIn', 'slideIn', 'flyIn', 'rotateIn'];
const EMPHASIS_EFFECTS: AnimationEffect[] = ['pulse', 'shake', 'blink', 'scale', 'highlight'];
const EXIT_EFFECTS: AnimationEffect[] = ['fadeOut', 'zoomOut', 'slideOut', 'flyOut', 'rotateOut'];

function getEffectType(effect: AnimationEffect): AnimationType {
  if (ENTER_EFFECTS.includes(effect)) return 'enter';
  if (EMPHASIS_EFFECTS.includes(effect)) return 'emphasis';
  return 'exit';
}

function needsParams(effect: AnimationEffect): boolean {
  return ['slideIn', 'flyIn', 'slideOut', 'flyOut', 'scale', 'rotateIn', 'rotateOut', 'highlight'].includes(effect);
}

function getDefaultParams(effect: AnimationEffect): AnimationConfig['params'] {
  switch (effect) {
    case 'slideIn':
    case 'flyIn':
    case 'slideOut':
    case 'flyOut':
      return { direction: 'right', distance: 100 };
    case 'scale':
      return { fromScale: 1, toScale: 1.2 };
    case 'rotateIn':
    case 'rotateOut':
      return { fromAngle: 0, toAngle: 360 };
    case 'highlight':
      return { brightness: 1.5 };
    default:
      return { fromOpacity: 0, toOpacity: 1 };
  }
}

function fixStartType(index: number, prev: AnimationConfig | undefined): StartType {
  if (index === 0) return 'click';
  if (prev?.startType === 'click') return 'withPrev';
  return 'afterPrev';
}

export default function AnimationPanel({ engine, animationEngine, onRefresh }: AnimationPanelProps) {
  const doc = engine.scene.getDocument();
  const slideId = doc.currentSlideId;
  const slide = doc.slides[slideId];
  const animations = engine.scene.getSlideAnimations(slideId);
  const steps = buildClickSteps(animations);

  const selectedIds = engine.getEditorState().selectedElementIds;
  const selectedId = selectedIds[0] ?? null;

  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [effect, setEffect] = useState<AnimationEffect>('fadeIn');
  const [startType, setStartType] = useState<StartType>('click');
  const [duration, setDuration] = useState(0.8);
  const [delay, setDelay] = useState(0);
  const [easing, setEasing] = useState<EasingPreset>('ease-in-out');
  const [repeatCount, setRepeatCount] = useState(1);
  const [enable, setEnable] = useState(true);

  // Param state
  const [direction, setDirection] = useState<SlideDirection>('right');
  const [distance, setDistance] = useState(100);
  const [fromScale, setFromScale] = useState(1);
  const [toScale, setToScale] = useState(1.2);
  const [fromAngle, setFromAngle] = useState(0);
  const [toAngle, setToAngle] = useState(360);
  const [brightness, setBrightness] = useState(1.5);

  const resetForm = useCallback(() => {
    setName('');
    setEffect('fadeIn');
    setStartType('click');
    setDuration(0.8);
    setDelay(0);
    setEasing('ease-in-out');
    setRepeatCount(1);
    setEnable(true);
    setDirection('right');
    setDistance(100);
    setFromScale(1);
    setToScale(1.2);
    setFromAngle(0);
    setToAngle(360);
    setBrightness(1.5);
  }, []);

  const buildParams = useCallback((): AnimationConfig['params'] => {
    if (!needsParams(effect)) return { fromOpacity: 0, toOpacity: 1 };
    switch (effect) {
      case 'slideIn':
      case 'flyIn':
      case 'slideOut':
      case 'flyOut':
        return { direction, distance };
      case 'scale':
        return { fromScale, toScale };
      case 'rotateIn':
      case 'rotateOut':
        return { fromAngle, toAngle };
      case 'highlight':
        return { brightness };
      default:
        return { fromOpacity: 0, toOpacity: 1 };
    }
  }, [effect, direction, distance, fromScale, toScale, fromAngle, toAngle, brightness]);

  const loadFormFromConfig = useCallback((config: AnimationConfig) => {
    setName(config.name);
    setEffect(config.effect);
    setStartType(config.startType);
    setDuration(config.duration);
    setDelay(config.delay);
    setEasing(config.easing);
    setRepeatCount(config.repeatCount);
    setEnable(config.enable);
    if (needsParams(config.effect)) {
      const p = config.params;
      if ('direction' in p) {
        setDirection(p.direction as SlideDirection);
        setDistance(p.distance);
      }
      if ('fromScale' in p) {
        setFromScale(p.fromScale);
        setToScale(p.toScale);
      }
      if ('fromAngle' in p) {
        setFromAngle(p.fromAngle);
        setToAngle(p.toAngle);
      }
      if ('brightness' in p) {
        setBrightness(p.brightness);
      }
    }
  }, []);

  const buildConfig = useCallback((): AnimationConfig => {
    const autoName = name.trim() || `${effect} animation`;
    return {
      id: uid(),
      elementId: selectedId ?? '',
      name: autoName,
      enable,
      type: getEffectType(effect),
      effect,
      startType,
      duration,
      delay: delay < 0 ? 0.2 : delay,
      easing,
      repeatCount,
      params: buildParams(),
    };
  }, [name, effect, startType, duration, delay, easing, repeatCount, enable, selectedId, buildParams]);

  const handleAdd = useCallback(() => {
    if (!selectedId) return;
    const config = buildConfig();
    // Default startType based on the current element's animations, not the whole slide
    const elementAnimations = animations.filter((a) => a.elementId === selectedId);
    const defaultStartType = elementAnimations.length === 0 ? 'click' : 'afterPrev';
    config.startType = defaultStartType;
    engine.execute(new AddAnimationCommand(engine.scene, slideId, config));
    animationEngine.register(config);
    onRefresh();
    // Keep form open for rapid multi-add, but reset some fields
    setName('');
  }, [selectedId, buildConfig, animations, engine, slideId, animationEngine, onRefresh]);

  // Reset form startType to 'click' when switching elements (unless editing)
  useEffect(() => {
    if (!editingId) {
      setStartType('click');
    }
  }, [selectedId, editingId]);

  const handleUpdate = useCallback(() => {
    if (!editingId) return;
    const updates: Partial<AnimationConfig> = {
      name: name.trim() || `${effect} animation`,
      type: getEffectType(effect),
      effect,
      startType,
      duration,
      delay: delay < 0 ? 0.2 : delay,
      easing,
      repeatCount,
      enable,
      params: buildParams(),
    };
    engine.execute(new UpdateAnimationCommand(engine.scene, editingId, updates));
    // Sync to animationEngine
    const updated = engine.scene.getAnimation(editingId);
    if (updated) animationEngine.register(updated);
    setEditingId(null);
    resetForm();
    onRefresh();
  }, [editingId, name, effect, startType, duration, delay, easing, repeatCount, enable, buildParams, engine, resetForm, onRefresh, animationEngine]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    resetForm();
  }, [resetForm]);

  const handleRemove = useCallback(
    (configId: string) => {
      engine.execute(new RemoveAnimationCommand(engine.scene, configId));
      animationEngine.unregister(configId);
      if (editingId === configId) {
        setEditingId(null);
        resetForm();
      }
      onRefresh();
    },
    [engine, animationEngine, editingId, resetForm, onRefresh]
  );

  const handlePlay = useCallback(
    (configId: string) => {
      animationEngine.stopAll();
      const ctrl = animationEngine.play(configId);
      if (ctrl) {
        ctrl.onFinish(() => {
          animationEngine.stopAll();
        });
      }
    },
    [animationEngine]
  );

  const handlePlayFromHere = useCallback(
    (configId: string) => {
      animationEngine.stopAll();
      // Find which step contains this animation
      let stepIndex = -1;
      for (let i = 0; i < steps.length; i++) {
        for (const batch of steps[i].batches) {
          if (batch.animations.some((a) => a.id === configId)) {
            stepIndex = i;
            break;
          }
        }
        if (stepIndex >= 0) break;
      }
      if (stepIndex < 0) return;
      // Play all animations in this step from first batch
      const step = steps[stepIndex];
      for (const batch of step.batches) {
        for (const anim of batch.animations) {
          animationEngine.play(anim.id);
        }
      }
    },
    [animationEngine, steps]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = slide.animationIds.indexOf(active.id as string);
      const newIndex = slide.animationIds.indexOf(over.id as string);
      if (oldIndex < 0 || newIndex < 0) return;
      const reorderedIds = arrayMove(slide.animationIds, oldIndex, newIndex);
      // Auto-fix startType for moved item
      const movedId = active.id as string;
      const movedIndex = reorderedIds.indexOf(movedId);
      const movedAnim = engine.scene.getAnimation(movedId);
      if (movedAnim && movedIndex >= 0) {
        const prevAnim = movedIndex > 0 ? engine.scene.getAnimation(reorderedIds[movedIndex - 1]) : undefined;
        const newStartType = fixStartType(movedIndex, prevAnim);
        if (newStartType !== movedAnim.startType) {
          engine.execute(new UpdateAnimationCommand(engine.scene, movedId, { startType: newStartType }));
        }
      }
      engine.execute(new ReorderAnimationsCommand(engine.scene, slideId, reorderedIds));
      onRefresh();
    },
    [slide, slideId, engine, onRefresh]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Compute step number for each animation
  const stepNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < steps.length; i++) {
      const firstAnim = steps[i].batches[0]?.animations[0];
      if (firstAnim) {
        map.set(firstAnim.id, i + 1);
      }
    }
    return map;
  }, [steps]);

  // Compute batch relationship indicator for each animation
  const relationMap = useMemo(() => {
    const map = new Map<string, 'click' | 'withPrev' | 'afterPrev'>();
    for (const anim of animations) {
      map.set(anim.id, anim.startType);
    }
    return map;
  }, [animations]);

  const slideElements = engine.scene.getSlideElements(slideId);
  const elementNameMap = useMemo(() => new Map(slideElements.map((el) => [el.id, el.name])), [slideElements]);

  return (
    <div
      style={{
        width: 400,
        height: '100%',
        backgroundColor: '#f9fafb',
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Animations</h3>

      {/* Global Animation List */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: 16 }}>
        {animations.length === 0 ? (
          <div style={{ fontSize: 12, color: '#9ca3af', padding: '20px 0' }}>
            No animations. Select an element and add one.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slide?.animationIds ?? []} strategy={verticalListSortingStrategy}>
              {animations.map((anim, index) => (
                <SortableAnimationRow
                  key={anim.id}
                  anim={anim}
                  index={index}
                  stepNumber={stepNumberMap.get(anim.id)}
                  relation={relationMap.get(anim.id) ?? 'click'}
                  elementName={elementNameMap.get(anim.elementId) ?? anim.elementId}
                  isEditing={anim.id === editingId}
                  onEdit={() => {
                    setEditingId(anim.id);
                    loadFormFromConfig(anim);
                  }}
                  onPlay={() => handlePlay(anim.id)}
                  onPlayFromHere={() => handlePlayFromHere(anim.id)}
                  onRemove={() => handleRemove(anim.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add / Edit Form */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: 16,
          maxHeight: '45%',
          overflowY: 'auto',
        }}
      >
        <h4 style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {editingId ? 'Edit Animation' : 'Add Animation'}
        </h4>

        {!selectedId && !editingId ? (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Select an element on canvas to add animation</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TextField label="Name" value={name} onChange={setName} placeholder={`${effect} animation`} />

            <SelectField
              label="Effect"
              value={effect}
              options={[
                { label: '--- Enter ---', value: '', disabled: true },
                ...ENTER_EFFECTS.map((e) => ({ label: e, value: e })),
                { label: '--- Emphasis ---', value: '', disabled: true },
                ...EMPHASIS_EFFECTS.map((e) => ({ label: e, value: e })),
                { label: '--- Exit ---', value: '', disabled: true },
                ...EXIT_EFFECTS.map((e) => ({ label: e, value: e })),
              ]}
              onChange={(v) => setEffect(v as AnimationEffect)}
            />

            {needsParams(effect) && ['slideIn', 'flyIn', 'slideOut', 'flyOut'].includes(effect) && (
              <>
                <SelectField
                  label="Direction"
                  value={direction}
                  options={[
                    { label: 'Left', value: 'left' },
                    { label: 'Right', value: 'right' },
                    { label: 'Up', value: 'up' },
                    { label: 'Down', value: 'down' },
                  ]}
                  onChange={(v) => setDirection(v as SlideDirection)}
                />
                <NumberField label="Distance (px)" value={distance} min={0} step={10} onChange={setDistance} />
              </>
            )}

            {effect === 'scale' && (
              <>
                <NumberField label="From Scale" value={fromScale} min={0} step={0.1} onChange={setFromScale} />
                <NumberField label="To Scale" value={toScale} min={0} step={0.1} onChange={setToScale} />
              </>
            )}

            {['rotateIn', 'rotateOut'].includes(effect) && (
              <>
                <NumberField label="From Angle" value={fromAngle} step={15} onChange={setFromAngle} />
                <NumberField label="To Angle" value={toAngle} step={15} onChange={setToAngle} />
              </>
            )}

            {effect === 'highlight' && (
              <NumberField label="Brightness" value={brightness} min={1} step={0.1} onChange={setBrightness} />
            )}

            <SelectField
              label="Start"
              value={startType}
              options={[
                { label: 'On Click (new step)', value: 'click' },
                { label: 'With Previous (same batch)', value: 'withPrev' },
                { label: 'After Previous (new batch)', value: 'afterPrev' },
              ]}
              onChange={(v) => setStartType(v as StartType)}
            />

            <NumberField label="Duration (s)" value={duration} min={0.1} step={0.1} onChange={setDuration} />
            <NumberField label="Delay (s)" value={delay} min={0} step={0.1} onChange={setDelay} />

            <SelectField
              label="Easing"
              value={easing}
              options={[
                { label: 'Linear', value: 'linear' },
                { label: 'Ease In', value: 'ease-in' },
                { label: 'Ease Out', value: 'ease-out' },
                { label: 'Ease In Out', value: 'ease-in-out' },
                { label: 'Bounce', value: 'bounce' },
                { label: 'Elastic', value: 'elastic' },
              ]}
              onChange={(v) => setEasing(v as EasingPreset)}
            />

            <NumberField label="Repeat" value={repeatCount} min={1} step={1} onChange={setRepeatCount} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
              <input type="checkbox" checked={enable} onChange={(e) => setEnable(e.target.checked)} />
              Enabled
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={!selectedId && !editingId}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  backgroundColor: !selectedId && !editingId ? '#f3f4f6' : '#ffffff',
                  color: !selectedId && !editingId ? '#9ca3af' : '#374151',
                  cursor: !selectedId && !editingId ? 'not-allowed' : 'pointer',
                }}
              >
                {editingId ? 'Save Changes' : 'Add Animation'}
              </button>
              {editingId && (
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 4,
                    backgroundColor: '#f9fafb',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sortable Row Component
// ============================================================================

function SortableAnimationRow({
  anim,
  index,
  stepNumber,
  relation,
  elementName,
  isEditing,
  onEdit,
  onPlay,
  onPlayFromHere,
  onRemove,
}: {
  anim: AnimationConfig;
  index: number;
  stepNumber?: number;
  relation: 'click' | 'withPrev' | 'afterPrev';
  elementName: string;
  isEditing: boolean;
  onEdit: () => void;
  onPlay: () => void;
  onPlayFromHere: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: anim.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const relationColor =
    relation === 'click' ? '#3b82f6' : relation === 'withPrev' ? '#10b981' : '#f59e0b';
  const relationLabel = relation === 'click' ? 'click' : relation === 'withPrev' ? 'with' : 'after';
  const relationIcon = relation === 'withPrev' ? '↔' : relation === 'afterPrev' ? '↓' : '';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        backgroundColor: isEditing ? '#fef3c7' : '#ffffff',
        borderRadius: 4,
        border: isEditing ? '1px solid #f59e0b' : '1px solid #e5e7eb',
        marginBottom: 6,
        fontSize: 12,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
        opacity: anim.enable ? 1 : 0.5,
      }}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: '#9ca3af', fontSize: 14, userSelect: 'none', flexShrink: 0 }}
      >
        ⋮⋮
      </span>

      {/* Step badge */}
      {stepNumber !== undefined && (
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {stepNumber}
        </span>
      )}
      {stepNumber === undefined && <span style={{ width: 20, flexShrink: 0 }} />}

      {/* Relation indicator */}
      <span style={{ color: relationColor, fontSize: 11, width: 16, textAlign: 'center', flexShrink: 0 }}>
        {relationIcon}
      </span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={onEdit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>{anim.name}</span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 3,
              backgroundColor: relationColor + '15',
              color: relationColor,
              fontWeight: 500,
            }}
          >
            {relationLabel}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
          {anim.effect} · {elementName} · {anim.duration}s
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          style={{
            padding: '2px 6px',
            fontSize: 11,
            border: '1px solid #d1d5db',
            borderRadius: 3,
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            cursor: 'pointer',
          }}
          title="Play"
        >
          ▶
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayFromHere();
          }}
          style={{
            padding: '2px 6px',
            fontSize: 11,
            border: '1px solid #d1d5db',
            borderRadius: 3,
            backgroundColor: '#f0fdf4',
            color: '#16a34a',
            cursor: 'pointer',
          }}
          title="Play from here"
        >
          ⏵⏵
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            padding: '2px 6px',
            fontSize: 11,
            border: '1px solid #d1d5db',
            borderRadius: 3,
            backgroundColor: '#ffffff',
            color: '#6b7280',
            cursor: 'pointer',
          }}
          title="Edit"
        >
          ✎
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            padding: '2px 6px',
            fontSize: 11,
            border: '1px solid #d1d5db',
            borderRadius: 3,
            backgroundColor: '#ffffff',
            color: '#ef4444',
            cursor: 'pointer',
          }}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Form Components
// ============================================================================

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 90, flexShrink: 0 }}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
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

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 90, flexShrink: 0 }}>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(Number(e.target.value))}
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

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string; disabled?: boolean }[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
      <span style={{ width: 90, flexShrink: 0 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
          <option key={opt.value + opt.label} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
