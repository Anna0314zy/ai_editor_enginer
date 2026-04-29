import { useState, useEffect, useRef, useCallback } from 'react';
import Moveable from 'react-moveable';
import type { Engine } from '../engine';
import { MoveElementCommand, BatchMoveCommand, snapEngine } from '../engine';
import { useStores, useSelectionStore, useSceneStore } from '../store';
import type { Guide, Element } from '../types';
import GuidesLayer from './GuidesLayer';

interface MoveableLayerProps {
  engine: Engine;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface CachedRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function MoveableLayer({ engine, containerRef }: MoveableLayerProps) {
  const { selectionStore, sceneStore } = useStores();
  const selectionSnapshot = useSelectionStore(selectionStore);
  const sceneSnapshot = useSceneStore(sceneStore);
  const [targets, setTargets] = useState<(HTMLElement | SVGElement)[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const moveableRef = useRef<Moveable>(null);
  const dragStartRef = useRef<Record<string, { x: number; y: number }>>({});
  const snapResultRef = useRef<Record<string, { x: number; y: number }>>({});
  const rotateStartRef = useRef<Record<string, number>>({});
  const resizeStartRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const otherRectsRef = useRef<CachedRect[]>([]);
  const batchRef = useRef<{ id: string; updates: Partial<Omit<Element, 'id' | 'type'>> }[]>([]);
  const batchPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const ids = selectionSnapshot.selectedIds;
    const container = containerRef.current;
    const elements = ids
      .map((id) => container?.querySelector(`[data-element-id="${id}"]`))
      .filter((el): el is HTMLElement => el !== null);
    setTargets(elements);
    // Sync moveable frame after any external state change (undo/redo, property panel, etc.)
    requestAnimationFrame(() => {
      moveableRef.current?.updateRect();
    });

    // Pre-compute rects for snapEngine; rebuild only when engine data changes
    otherRectsRef.current = sceneSnapshot.currentPageElements
      .map((e) => ({ id: e.id, x: e.x, y: e.y, width: e.width, height: e.height }));
  }, [selectionSnapshot, sceneSnapshot, containerRef]);

  const queueMove = useCallback((id: string, updates: Partial<Omit<Element, 'id' | 'type'>>) => {
    batchRef.current.push({ id, updates });
    if (!batchPromiseRef.current) {
      batchPromiseRef.current = Promise.resolve().then(() => {
        const moves = batchRef.current;
        if (moves.length === 1) {
          engine.execute(new MoveElementCommand(engine.scene, moves[0].id, moves[0].updates));
        } else if (moves.length > 1) {
          engine.execute(new BatchMoveCommand(engine.scene, moves));
        }
        batchRef.current = [];
        batchPromiseRef.current = null;
      });
    }
  }, [engine]);

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
          const el = sceneStore.getElement(id);
          if (!el) return;
          dragStartRef.current[id] = { x: el.x, y: el.y };
        }}
        onDrag={({ target, left, top }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = sceneStore.getElement(id);
          if (!el) return;

          // Viewport culling: only nearby rects participate in snapping
          const RANGE = 500;
          const nearbyRects = otherRectsRef.current.filter((r) => {
            if (r.id === id) return false;
            return (
              Math.abs(r.x - el.x) < RANGE + r.width + el.width &&
              Math.abs(r.y - el.y) < RANGE + r.height + el.height
            );
          });

          const nextRect = { id, x: left, y: top, width: el.width, height: el.height };
          const result = snapEngine({
            currentRect: nextRect,
            otherRects: nearbyRects,
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
          const el = sceneStore.getElement(id);

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

          queueMove(id, { x: finalX, y: finalY });
          setGuides([]);
          delete snapResultRef.current[id];
          // updateRect is handled by the useEffect watching `version`
        }}
        onRotateStart={({ target }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = sceneStore.getElement(id);
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
          queueMove(id, { rotation: lastEvent.rotate });
          // updateRect is handled by the useEffect watching `version`
        }}
        onResizeStart={({ target }) => {
          const id = target.getAttribute('data-element-id');
          if (!id) return;
          const el = sceneStore.getElement(id);
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
          const el = sceneStore.getElement(id);

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

          queueMove(id, {
            x: newX,
            y: newY,
            width: lastEvent.width,
            height: lastEvent.height,
          });
          // updateRect is handled by the useEffect watching `version`
        }}
      />
      <GuidesLayer guides={guides} />
    </>
  );
}
