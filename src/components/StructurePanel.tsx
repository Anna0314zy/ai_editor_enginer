import { useState, useCallback, useRef, Fragment } from 'react';
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
import { PAGE_DEFAULT_WIDTH, PAGE_DEFAULT_HEIGHT } from '../types';
import type { PageBackground } from '../types';

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
const CANVAS_WIDTH = PAGE_DEFAULT_WIDTH;
const CANVAS_HEIGHT = PAGE_DEFAULT_HEIGHT;
const SCALE = THUMB_WIDTH / CANVAS_WIDTH;

function getThumbBackgroundStyle(background: PageBackground | undefined): React.CSSProperties {
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
        elements: {},
        animations: {},
      }),
    );
  };

  const handleAddVideoPage = () => {
    const newId = `page-${Date.now()}`;
    const count = Object.keys(doc.pages).length + 1;
    engine.execute(
      new AddPageCommand(engine.scene, {
        id: newId,
        name: `Video ${count}`,
        kind: 'video',
        elements: {},
        animations: {},
      }),
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
        currentPageId,
      ),
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

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string, _index: number) => {
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
    [draggingId, doc.structureItems],
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
      (item) => item.type === 'page' && item.id === draggingId,
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
    <div className="w-[220px] h-full border-r border-gray-200 bg-gray-50 flex flex-col select-none">
      <div className="px-4 py-3 border-b border-gray-200 flex gap-2">
        <button
          onClick={handleAddPage}
          className="flex-1 py-1.5 text-xs border border-gray-300 rounded bg-white cursor-pointer"
        >
          + Page
        </button>
        <button
          onClick={handleAddVideoPage}
          className="flex-1 py-1.5 text-xs border border-gray-300 rounded bg-white cursor-pointer"
          title="新建视频页"
        >
          + Video
        </button>
        <button
          onClick={handleAddNode}
          className="flex-1 py-1.5 text-xs border border-gray-300 rounded bg-white cursor-pointer"
        >
          + Node
        </button>
      </div>
      <div className="flex-1 overflow-auto py-2" onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {processed.map((proc) => {
          if (!proc.visible) return null;
          const isPage = proc.type === 'page';
          const isSelected = isPage && proc.id === doc.currentPageId;
          const isDragging = draggingId === proc.id;

          return (
            <div key={`${proc.type}-${proc.id}`}>
              {dragOverIndex === proc.index && draggingId !== null && (
                <div
                  className="h-0.5 bg-blue-500"
                  style={{
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
                className={`p-1.5 rounded ${
                  isSelected
                    ? 'bg-blue-100 border border-blue-500'
                    : isDragging
                      ? 'bg-gray-100 border border-transparent'
                      : 'bg-transparent border border-transparent'
                } ${isPage ? 'cursor-grab' : 'cursor-pointer'} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
                style={{
                  margin: `0 8px 0 ${8 + proc.indent}px`,
                }}
              >
                {proc.type === 'node' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(proc.id);
                        }}
                        className="text-[10px] text-gray-500 cursor-pointer w-3.5 text-center"
                      >
                        {collapsedNodes.has(proc.id) ? '▶' : '▼'}
                      </span>
                      <span className="text-[13px] font-semibold text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
                        {doc.nodes[proc.id]?.name ?? 'Untitled'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(proc.index);
                      }}
                      className="border-none bg-transparent text-gray-400 cursor-pointer text-sm px-1"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      className="overflow-hidden relative rounded border border-gray-200"
                      style={{
                        width: THUMB_WIDTH,
                        height: THUMB_HEIGHT,
                        ...getThumbBackgroundStyle(
                          doc.pages[proc.id]?.background ?? doc.background,
                        ),
                      }}
                    >
                      {doc.pages[proc.id]?.kind === 'video' ? (
                        <div className="absolute inset-0 bg-black flex items-center justify-center text-white text-xs gap-1">
                          <span>▶</span>
                          <span className="opacity-80">Video Page</span>
                        </div>
                      ) : (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            width: CANVAS_WIDTH,
                            height: CANVAS_HEIGHT,
                            transform: `scale(${SCALE})`,
                            transformOrigin: 'top left',
                          }}
                        >
                          {Object.values(doc.pages[proc.id]?.elements ?? {}).map((el) => (
                            <Fragment key={el.id}>{renderThumbnail(el)}</Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap flex items-center gap-1">
                        {doc.pages[proc.id]?.kind === 'video' && (
                          <span className="text-blue-500">▶</span>
                        )}
                        {doc.pages[proc.id]?.name ?? 'Untitled'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(proc.index);
                        }}
                        className="border-none bg-transparent text-gray-400 cursor-pointer text-xs px-0.5"
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
          <div className="h-0.5 bg-blue-500 mx-2 my-0.5" />
        )}
      </div>
    </div>
  );
}
