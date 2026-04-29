import { useState, useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import type { Engine } from '../engine';
import {
  AddPageCommand,
  RemovePageCommand,
  AddNodeCommand,
  RemoveNodeCommand,
  ReorderStructureItemsCommand,
} from '../engine';
import { renderThumbnail } from '../renderer';
import { useStores, useSceneStore } from '../store';

interface StructurePanelProps {
  engine: Engine;
}

interface ProcessedItem {
  index: number;
  type: 'node' | 'page';
  id: string;
  visible: boolean;
  indent: number;
}

const THUMB_WIDTH = 160;
const THUMB_HEIGHT = 90;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
const SCALE = THUMB_WIDTH / CANVAS_WIDTH;

export default function StructurePanel({ engine }: StructurePanelProps) {
  const { sceneStore } = useStores();
  const sceneSnapshot = useSceneStore(sceneStore);
  const doc = sceneSnapshot.document;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const dragOffsetRef = useRef<number>(0);

  const toggleNode = (nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    const count = Object.keys(doc.pages).length + 1;
    engine.execute(
      new AddPageCommand(engine.scene, {
        id: newId,
        name: `Page ${count}`,
        background: '#ffffff',
        elements: {},
        animations: {},
      })
    );
  };

  const handleAddNode = () => {
    const currentPageId = doc.currentPageId;
    if (!currentPageId) return;
    const newId = `node-${Date.now()}`;
    engine.execute(
      new AddNodeCommand(
        engine.scene,
        { id: newId, name: `Section ${Object.keys(doc.nodes).length + 1}` },
        currentPageId
      )
    );
  };

  const handleSelectPage = (pageId: string) => {
    engine.setCurrentPageId(pageId);
  };

  const handleDeleteItem = (index: number) => {
    const item = doc.structureItems[index];
    if (!item) return;
    if (item.type === 'page') {
      engine.execute(new RemovePageCommand(engine.scene, item.id));
    } else {
      engine.execute(new RemoveNodeCommand(engine.scene, item.id));
    }
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string, index: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    dragOffsetRef.current = e.clientY - rect.top;
  };

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      if (draggingId === null) return;
      const item = doc.structureItems[index];
      if (item?.type !== 'page' && item?.type !== 'node') return;

      const target = e.currentTarget as HTMLDivElement;
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertIndex = e.clientY < midY ? index : index + 1;
      setDragOverIndex(insertIndex);
    },
    [draggingId, doc.structureItems]
  );

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggingId === null || dragOverIndex === null) {
      setDraggingId(null);
      setDragOverIndex(null);
      return;
    }

    const fromIndex = doc.structureItems.findIndex(
      (item) => item.type === 'page' && item.id === draggingId
    );
    if (fromIndex < 0) {
      setDraggingId(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...doc.structureItems];
    const [moved] = newOrder.splice(fromIndex, 1);
    const toIndex = dragOverIndex > fromIndex ? dragOverIndex - 1 : dragOverIndex;
    newOrder.splice(toIndex, 0, moved);
    engine.execute(new ReorderStructureItemsCommand(engine.scene, newOrder));
    setDraggingId(null);
    setDragOverIndex(null);
  };

  // Pre-process structureItems to compute visibility and indentation
  const processed: ProcessedItem[] = [];
  let activeNodeId: string | null = null;
  let isCollapsed = false;

  for (let i = 0; i < doc.structureItems.length; i++) {
    const item = doc.structureItems[i];
    if (item.type === 'node') {
      activeNodeId = item.id;
      isCollapsed = collapsedNodes.has(item.id);
      processed.push({ index: i, type: 'node', id: item.id, visible: true, indent: 0 });
    } else {
      processed.push({
        index: i,
        type: 'page',
        id: item.id,
        visible: !isCollapsed,
        indent: activeNodeId ? 16 : 0,
      });
    }
  }

  return (
    <div
      style={{
        width: 220,
        height: '100%',
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: 8,
        }}
      >
        <button
          onClick={handleAddPage}
          style={{
            flex: 1,
            padding: '6px 0',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
        >
          + Page
        </button>
        <button
          onClick={handleAddNode}
          style={{
            flex: 1,
            padding: '6px 0',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
        >
          + Node
        </button>
      </div>
      <div
        style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {processed.map((proc) => {
          if (!proc.visible) return null;
          const isPage = proc.type === 'page';
          const isSelected = isPage && proc.id === doc.currentPageId;
          const isDragging = draggingId === proc.id;

          return (
            <div key={`${proc.type}-${proc.id}`}>
              {dragOverIndex === proc.index && draggingId !== null && (
                <div
                  style={{
                    height: 2,
                    backgroundColor: '#3b82f6',
                    margin: `2px 8px 2px ${8 + (isPage ? proc.indent : 0)}px`,
                  }}
                />
              )}
              <div
                draggable={isPage}
                onDragStart={(e) => handleDragStart(e, proc.id, proc.index)}
                onDragOver={(e) => handleDragOver(e, proc.index)}
                onClick={() => {
                  if (isPage) handleSelectPage(proc.id);
                }}
                style={{
                  margin: `0 8px 0 ${8 + proc.indent}px`,
                  padding: '6px',
                  borderRadius: 4,
                  backgroundColor: isSelected ? '#dbeafe' : isDragging ? '#f3f4f6' : 'transparent',
                  cursor: isPage ? 'grab' : 'pointer',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                  opacity: isDragging ? 0.5 : 1,
                }}
              >
                {proc.type === 'node' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(proc.id);
                        }}
                        style={{
                          fontSize: 10,
                          color: '#6b7280',
                          cursor: 'pointer',
                          width: 14,
                          textAlign: 'center',
                        }}
                      >
                        {collapsedNodes.has(proc.id) ? '▶' : '▼'}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.nodes[proc.id]?.name ?? 'Untitled'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(proc.index);
                      }}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: '0 4px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        width: THUMB_WIDTH,
                        height: THUMB_HEIGHT,
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: doc.pages[proc.id]?.background ?? '#ffffff',
                        borderRadius: 4,
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          width: CANVAS_WIDTH,
                          height: CANVAS_HEIGHT,
                          transform: `scale(${SCALE})`,
                          transformOrigin: 'top left',
                          pointerEvents: 'none',
                        }}
                      >
                        {Object.values(doc.pages[proc.id]?.elements ?? {}).map((el) =>
                          renderThumbnail(el)
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: '#374151',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.pages[proc.id]?.name ?? 'Untitled'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(proc.index);
                        }}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: 12,
                          padding: '0 2px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {dragOverIndex === doc.structureItems.length && draggingId !== null && (
          <div
            style={{
              height: 2,
              backgroundColor: '#3b82f6',
              margin: '2px 8px',
            }}
          />
        )}
      </div>
    </div>
  );
}
