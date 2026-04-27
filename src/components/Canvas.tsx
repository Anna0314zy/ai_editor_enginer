import { useRef, useCallback } from 'react';
import type { DragEvent } from 'react';
import type { Engine } from '../engine';
import { AddElementCommand } from '../engine';
import type { AnimationEngine } from '../animation';
import { renderElement } from '../renderer';
import type { Element, ShapeElement, TextElement, ImageElement } from '../types';
import MoveableLayer from './MoveableLayer';

let uidCounter = 0;
function uid(): string {
  return `el-${Date.now()}-${uidCounter++}`;
}

interface CanvasProps {
  engine: Engine;
  animationEngine: AnimationEngine;
  onRefresh: () => void;
  version: number;
}

export default function Canvas({ engine, animationEngine, onRefresh, version }: CanvasProps) {
  const slideRef = useRef<HTMLDivElement>(null);

  const doc = engine.scene.getDocument();
  const currentPageId = doc.currentPageId;
  const elements = engine.scene.getPageElements(currentPageId);
  const selectedIds = engine.getEditorState().selectedElementIds;

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
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const element = createElement(data.type, x, y, data.shapeType);

      engine.execute(new AddElementCommand(engine.scene, currentPageId, element));
      engine.setEditorState({ selectedElementIds: [element.id] });
      onRefresh();
    },
    [engine, currentPageId, onRefresh]
  );

  const handleElementClick = useCallback(
    (id: string): void => {
      engine.setEditorState({ selectedElementIds: [id] });
      onRefresh();
    },
    [engine, onRefresh]
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const target = e.target as HTMLElement;
      const clickedElement = target.closest('[data-element-id]');
      const clickedMoveable = target.closest('.moveable-control-box');
      if (!clickedElement && !clickedMoveable) {
        engine.setEditorState({ selectedElementIds: [] });
        onRefresh();
      }
    },
    [engine, onRefresh]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        ref={slideRef}
        style={{
          width: 960,
          height: 540,
          backgroundColor: doc.pages[currentPageId]?.background ?? '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onPointerDown={handleCanvasPointerDown}
      >
        {elements.map((el) =>
          renderElement(el, {
            onClick: handleElementClick,
            isSelected: selectedIds.includes(el.id),
          })
        )}
        <MoveableLayer engine={engine} onRefresh={onRefresh} version={version} containerRef={slideRef} />
      </div>
    </div>
  );
}

function createElement(
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
        src: 'https://picsum.photos/id/10/200x150',
        objectFit: 'cover',
      } as ImageElement;

    default:
      throw new Error(`Unknown element type: ${type}`);
  }
}
