import { useRef, useCallback, useEffect, useLayoutEffect, useState, Fragment } from 'react';
import type { DragEvent } from 'react';
import type { Engine } from '../engine';
import { AddElementCommand } from '../engine';
import type { AnimationEngine } from '../animation';
import { renderElement } from '../renderer';
import type { Element, ShapeElement, TextElement, ImageElement, PageBackground } from '../types';
import { PAGE_DEFAULT_WIDTH, PAGE_DEFAULT_HEIGHT } from '../types';
import { useStores, useSceneStore, useSelectionStore } from '../store';
import MoveableLayer from './MoveableLayer';

function getBackgroundStyle(background: PageBackground | undefined): React.CSSProperties {
  if (!background) return { backgroundColor: '#ffffff' };
  switch (background.type) {
    case 'solid':
      return { backgroundColor: background.color };
    case 'gradient': {
      const stops = background.stops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ');
      return { backgroundImage: `linear-gradient(${background.angle}deg, ${stops})` };
    }
    case 'image':
      return {
        backgroundImage: `url(${background.src})`,
        backgroundSize: background.fit,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: background.opacity,
      };
    default:
      return { backgroundColor: '#ffffff' };
  }
}

let uidCounter = 0;
function uid(): string {
  return `el-${Date.now()}-${uidCounter++}`;
}

interface CanvasProps {
  engine: Engine;
  animationEngine: AnimationEngine;
}

const VIEWPORT_PADDING = 16;

export default function Canvas({ engine, animationEngine }: CanvasProps) {
  const { sceneStore, selectionStore } = useStores();
  const sceneSnapshot = useSceneStore(sceneStore);
  const selectionSnapshot = useSelectionStore(selectionStore);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [viewportScale, setViewportScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const update = (): void => {
      const { width, height } = el.getBoundingClientRect();
      const w = width - VIEWPORT_PADDING * 2;
      const h = height - VIEWPORT_PADDING * 2;
      if (w <= 0 || h <= 0) return;
      const next = Math.min(w / PAGE_DEFAULT_WIDTH, h / PAGE_DEFAULT_HEIGHT, 1);
      setViewportScale(next);
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scope animation DOM queries to the canvas slide container so
  // animations always target the correct element in edit mode.
  useEffect(() => {
    animationEngine.setScopeRoot(slideRef.current);
    return () => {
      animationEngine.setScopeRoot(null);
    };
  }, [animationEngine]);

  const currentPageId = sceneSnapshot.currentPageId;
  const elements = sceneSnapshot.currentPageElements;
  const selectedIds = selectionSnapshot.selectedIds;

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;

      let data: { type: string; shapeType?: string };
      try {
        data = JSON.parse(raw);
      } catch {
        return;
      }

      const rect = slideRef.current?.getBoundingClientRect();
      if (!rect || viewportScale <= 0) return;

      const x = (e.clientX - rect.left) / viewportScale;
      const y = (e.clientY - rect.top) / viewportScale;
      const element = createElement(engine, data.type, x, y, data.shapeType);

      engine.execute(new AddElementCommand(engine.scene, currentPageId, element));
      selectionStore.select(element.id);
    },
    [engine, currentPageId, selectionStore, viewportScale]
  );

  const handleElementClick = useCallback(
    (id: string): void => {
      selectionStore.select(id);
    },
    [selectionStore]
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const target = e.target as HTMLElement;
      const clickedElement = target.closest('[data-element-id]');
      const clickedMoveable = target.closest('.moveable-control-box');
      if (!clickedElement && !clickedMoveable) {
        selectionStore.clear();
      }
    },
    [selectionStore]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: VIEWPORT_PADDING,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        style={{
          width: PAGE_DEFAULT_WIDTH * viewportScale,
          height: PAGE_DEFAULT_HEIGHT * viewportScale,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div
          ref={slideRef}
          style={{
            width: PAGE_DEFAULT_WIDTH,
            height: PAGE_DEFAULT_HEIGHT,
            transform: `scale(${viewportScale})`,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onPointerDown={handleCanvasPointerDown}
        >
        {/* Background layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...getBackgroundStyle(sceneSnapshot.currentPage?.background ?? sceneSnapshot.document.background),
          }}
        />
        {/* Safe area visual guide */}
        {(() => {
          const sa = sceneSnapshot.document.safeArea;
          if (!sa || (sa.top === 0 && sa.right === 0 && sa.bottom === 0 && sa.left === 0)) return null;
          return (
            <>
              {/* Unsafe zone overlays (subtle red tint) */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: sa.top, backgroundColor: 'rgba(239, 68, 68, 0.08)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: sa.top, right: 0, width: sa.right, bottom: sa.bottom, backgroundColor: 'rgba(239, 68, 68, 0.08)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: sa.bottom, backgroundColor: 'rgba(239, 68, 68, 0.08)', pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: sa.top, left: 0, width: sa.left, bottom: sa.bottom, backgroundColor: 'rgba(239, 68, 68, 0.08)', pointerEvents: 'none', zIndex: 1 }} />
              {/* Safe area boundary (dashed blue) */}
              <div
                style={{
                  position: 'absolute',
                  top: sa.top,
                  left: sa.left,
                  right: sa.right,
                  bottom: sa.bottom,
                  border: '1px dashed rgba(59, 130, 246, 0.5)',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
            </>
          );
        })()}
        {/* Elements */}
        {elements.map((el) => (
          <Fragment key={el.id}>
            {renderElement(el, {
              onClick: handleElementClick,
              isSelected: selectedIds.includes(el.id),
            })}
          </Fragment>
        ))}

        <MoveableLayer engine={engine} containerRef={slideRef} zoom={viewportScale} />
        </div>
      </div>
    </div>
  );
}

function createElement(
  engine: Engine,
  type: string,
  x: number,
  y: number,
  shapeType?: string
): Element {
  const base = {
    id: uid(),
    name: 'New Element',
    x,
    y,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
  };

  switch (type) {
    case 'shape':
      return {
        ...base,
        type: 'shape',
        name: shapeType ?? 'Shape',
        width: 120,
        height: 120,
        shapeType: (shapeType as ShapeElement['shapeType']) ?? 'rectangle',
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 2,
        cornerRadius: shapeType === 'rounded-rectangle' ? 16 : undefined,
        sides: shapeType === 'polygon' ? 6 : undefined,
        starPoints: shapeType === 'star' ? 5 : undefined,
        starInnerRadius: shapeType === 'star' ? 0.5 : undefined,
      } as ShapeElement;

    case 'text':
      return {
        ...base,
        type: 'text',
        name: 'Text',
        width: 160,
        height: 40,
        text: 'New Text',
        fontSize: 20,
        fontFamily: 'Inter, sans-serif',
        color: '#111827',
        align: 'left',
      } as TextElement;

    case 'image':
      return {
        ...base,
        type: 'image',
        name: 'Image',
        width: 200,
        height: 150,
        src: 'https://gips3.baidu.com/it/u=100751361,1567855012&fm=3028&app=3028&f=JPEG&fmt=auto?w=960&h=1280',
        objectFit: 'contain',
      } as ImageElement;

    default: {
      const descriptor = engine.pluginRegistry.getComponent(type);
      if (descriptor) {
        return descriptor.createDefaultElement(x, y);
      }
      throw new Error(`Unknown element type: ${type}`);
    }
  }
}
