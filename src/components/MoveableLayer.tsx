import { useState, useEffect, useRef } from 'react';
import Moveable from 'react-moveable';
import type { Engine } from '../engine';
import { MoveElementCommand, snapEngine } from '../engine';
import type { Guide } from '../types';
import GuidesLayer from './GuidesLayer';

interface MoveableLayerProps {
  engine: Engine;
  onRefresh: () => void;
  version: number;
}

export default function MoveableLayer({ engine, onRefresh, version }: MoveableLayerProps) {
  const [targets, setTargets] = useState<(HTMLElement | SVGElement)[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const moveableRef = useRef<Moveable>(null);
  const dragStartRef = useRef<Record<string, { x: number; y: number }>>({});
  const snapResultRef = useRef<Record<string, { x: number; y: number }>>({});
  const rotateStartRef = useRef<Record<string, number>>({});
  const resizeStartRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  useEffect(() => {
    const ids = engine.getEditorState().selectedElementIds;
    const elements = ids
      .map((id) => document.querySelector(`[data-element-id="${id}"]`))
      .filter((el): el is HTMLElement => el !== null);
    setTargets(elements);
    // Sync moveable frame after any external state change (undo/redo, property panel, etc.)
    requestAnimationFrame(() => {
      moveableRef.current?.updateRect();
    });
  }, [engine, version]);

  const getOtherRects = (excludeId: string) => {
    return engine.scene
      .getSlideElements(engine.scene.getDocument().currentSlideId)
      .filter((e) => e.id !== excludeId)
      .map((e) => ({ id: e.id, x: e.x, y: e.y, width: e.width, height: e.height }));
  };

  return (
    <>
      <Moveable
        ref={moveableRef}
        target={targets.length > 0 ? targets : null}
        draggable={true}
        rotatable={true}
        resizable={true}
        origin={false}
        keepRatio={false}
        onDragStart={({ target }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = engine.scene.getElement(id);
          if (!el) return;
          dragStartRef.current[id] = { x: el.x, y: el.y };
        }}
        onDrag={({ target, left, top }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = engine.scene.getElement(id);
          if (!el) return;

          const nextRect = { id, x: left, y: top, width: el.width, height: el.height };
          const result = snapEngine({
            currentRect: nextRect,
            otherRects: getOtherRects(id),
            canvasSize: { width: 960, height: 540 },
          });

          snapResultRef.current[id] = { x: result.x, y: result.y };

          const start = dragStartRef.current[id];
          if (start) {
            const dx = result.x - start.x;
            const dy = result.y - start.y;
            target.style.transform = `translate(${dx}px, ${dy}px) rotate(${el.rotation}deg)`;
          }
          setGuides(result.guides);
        }}
        onDragEnd={({ target, lastEvent }) => {
          const id = target.getAttribute('data-element-id');
          if (!id || !lastEvent) return;
          const el = engine.scene.getElement(id);

          // Use snapped position (moveable's lastEvent doesn't know about our snap override)
          const snapped = snapResultRef.current[id];
          const finalX = snapped ? snapped.x : lastEvent.left;
          const finalY = snapped ? snapped.y : lastEvent.top;

          // Pre-apply final left/top BEFORE clearing transform to avoid visual snap
          target.style.left = `${finalX}px`;
          target.style.top = `${finalY}px`;
          if (el) {
            target.style.transform = `rotate(${el.rotation}deg)`;
          }

          engine.execute(
            new MoveElementCommand(engine.scene, id, {
              x: finalX,
              y: finalY,
            })
          );
          setGuides([]);
          delete snapResultRef.current[id];
          onRefresh();
          // updateRect is handled by the useEffect watching `version`
        }}
        onRotateStart={({ target }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = engine.scene.getElement(id);
          if (!el) return;
          rotateStartRef.current[id] = el.rotation;
        }}
        onRotate={({ target, transform }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          target.style.transform = transform;
        }}
        onRotateEnd={({ target, lastEvent }) => {
          const id = target.getAttribute('data-element-id');
          if (!id || !lastEvent) return;
          engine.execute(
            new MoveElementCommand(engine.scene, id, {
              rotation: lastEvent.rotate,
            })
          );
          onRefresh();
          // updateRect is handled by the useEffect watching `version`
        }}
        onResizeStart={({ target }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = engine.scene.getElement(id);
          if (!el) return;
          resizeStartRef.current[id] = {
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          };
        }}
        onResize={({ target, width, height, drag }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;
          target.style.transform = drag.transform;
        }}
        onResizeEnd={({ target, lastEvent }) => {
          const id = target.getAttribute('data-element-id');
          if (!id || !lastEvent) return;
          const start = resizeStartRef.current[id];
          if (!start) return;
          const el = engine.scene.getElement(id);

          const newX = start.x + lastEvent.drag.translate[0];
          const newY = start.y + lastEvent.drag.translate[1];

          // Pre-apply final left/top BEFORE clearing transform to avoid visual snap
          target.style.left = `${newX}px`;
          target.style.top = `${newY}px`;
          target.style.width = `${lastEvent.width}px`;
          target.style.height = `${lastEvent.height}px`;
          if (el) {
            target.style.transform = `rotate(${el.rotation}deg)`;
          }

          engine.execute(
            new MoveElementCommand(engine.scene, id, {
              x: newX,
              y: newY,
              width: lastEvent.width,
              height: lastEvent.height,
            })
          );
          onRefresh();
          // updateRect is handled by the useEffect watching `version`
        }}
      />
      <GuidesLayer guides={guides} />
    </>
  );
}
