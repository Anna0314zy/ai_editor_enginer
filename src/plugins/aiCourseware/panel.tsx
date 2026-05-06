import { useState, useCallback, useMemo } from 'react';
import type { Engine } from '../../engine';
import {
  CompositeCommand,
  AddPageCommand,
  AddElementCommand,
  MoveElementCommand,
  DeleteElementCommand,
} from '../../engine';

import type { Page, Element, TextElement, ShapeElement, ImageElement } from '../../types';
import type { AnimationConfig } from '../../types/animation';
import { AddAnimationCommand } from '../../engine';
import { ApiAICoursewareService, getApiBaseUrl, setApiBaseUrl } from './apiService';
import type { BackendElement, BackendAnimationConfig } from './schema';

function generateId(): string {
  return `el-${Math.random().toString(36).slice(2, 9)}`;
}

function toElement(backend: BackendElement): Element {
  const base = {
    id: generateId(),
    name: backend.type === 'text' ? 'Text' : backend.type === 'shape' ? 'Shape' : 'Image',
    source: backend.source ?? 'ai',
    x: backend.x,
    y: backend.y,
    width: backend.width,
    height: backend.height,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
  };

  if (backend.type === 'text') {
    return {
      ...base,
      type: 'text',
      text: backend.text,
      fontSize: backend.fontSize ?? 24,
      fontFamily: backend.fontFamily ?? 'Arial, sans-serif',
      color: backend.color ?? '#1f2937',
      align: backend.align ?? 'left',
    } as TextElement;
  }

  if (backend.type === 'shape') {
    return {
      ...base,
      type: 'shape',
      shapeType: backend.shapeType,
      fill: backend.fill ?? '#e5e7eb',
      stroke: backend.stroke ?? 'transparent',
      strokeWidth: backend.strokeWidth ?? 0,
      cornerRadius: backend.cornerRadius,
    } as ShapeElement;
  }

  return {
    ...base,
    type: 'image',
    src: (backend as ImageElement).src,
    objectFit: (backend as ImageElement).objectFit ?? 'cover',
  } as ImageElement;
}

function toAnimationConfig(
  backend: BackendAnimationConfig,
  elementId: string
): AnimationConfig {
  return {
    id: generateId(),
    elementId,
    name: backend.name ?? backend.effect,
    enable: true,
    type: backend.type,
    effect: backend.effect,
    startType: backend.startType ?? 'afterPrev',
    duration: backend.duration ?? 0.8,
    delay: backend.delay ?? 0,
    easing: backend.easing ?? 'ease-out',
    repeatCount: backend.repeatCount ?? 0,
    params: backend.params ?? { fromOpacity: 0, toOpacity: 1 },
  };
}

interface AICoursewarePanelProps {
  engine: Engine;
  animationEngine: unknown;
}

type Mode = 'generate' | 'edit';

export default function AICoursewarePanel({ engine }: AICoursewarePanelProps) {
  const currentPageId = engine.scene.getDocument().currentPageId;
  const currentPage = engine.scene.getPage(currentPageId);

  const [mode, setMode] = useState<Mode>('generate');
  const [topic, setTopic] = useState('生成一个教小朋友加法的课件，幽默风格，可以4页');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [apiBaseUrl, setApiBaseUrlState] = useState(getApiBaseUrl);
  const [showApiConfig, setShowApiConfig] = useState(false);

  const service = useMemo(() => new ApiAICoursewareService(apiBaseUrl), [apiBaseUrl]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setMessage('Generating courseware...');
    try {
      const slides = await service.generateCourseware(topic.trim());
      console.log('Generated slides:', slides);

      const commands: CompositeCommand['commands'] = [];

      for (const slide of slides) {
        const pageId = `page-${Math.random().toString(36).slice(2, 9)}`;
        const page: Page = {
          id: pageId,
          name: slide.title,
          background: slide.background,
          elements: {},
          animations: {},
        };
        commands.push(new AddPageCommand(engine.scene, page, false));
        for (const element of slide.elements) {
          const el = toElement(element);
          commands.push(new AddElementCommand(engine.scene, pageId, el));
          if (element.animations) {
            for (const backendAnim of element.animations) {
              commands.push(
                new AddAnimationCommand(engine.scene, pageId, toAnimationConfig(backendAnim, el.id))
              );
            }
          }
        }
      }

      if (commands.length > 0) {
        engine.execute(new CompositeCommand(commands));
      }
      setMessage(`Generated ${slides.length} slides!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [topic, engine, service]);

  const handleEditPage = useCallback(async () => {
    if (!currentPage || !instruction.trim()) return;
    setLoading(true);
    setMessage('Editing page...');
    try {
      const result = await service.editPage(currentPage, instruction.trim());
      const commands: CompositeCommand['commands'] = [];

      for (const element of result.elementsToAdd) {
        commands.push(new AddElementCommand(engine.scene, currentPage.id, toElement(element)));
      }

      for (const update of result.elementsToUpdate) {
        commands.push(new MoveElementCommand(engine.scene, update.id, update.updates));
      }

      for (const elementId of result.elementsToRemove) {
        commands.push(new DeleteElementCommand(engine.scene, elementId, currentPage.id));
      }

      if (commands.length > 0) {
        engine.execute(new CompositeCommand(commands));
      }
      setMessage('Page edited!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Edit failed.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, instruction, engine, service]);

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
      <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>AI Assistant</h3>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setMode('generate')}
          disabled={mode === 'generate'}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: mode === 'generate' ? '#3b82f6' : '#ffffff',
            color: mode === 'generate' ? '#ffffff' : '#374151',
            cursor: mode === 'generate' ? 'default' : 'pointer',
          }}
        >
          Generate
        </button>
        <button
          onClick={() => setMode('edit')}
          disabled={mode === 'edit'}
          style={{
            flex: 1,
            padding: '8px 0',
            fontSize: 12,
            border: '1px solid #d1d5db',
            borderRadius: 4,
            backgroundColor: mode === 'edit' ? '#3b82f6' : '#ffffff',
            color: mode === 'edit' ? '#ffffff' : '#374151',
            cursor: mode === 'edit' ? 'default' : 'pointer',
          }}
        >
          Edit Page
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          onClick={() => setShowApiConfig(!showApiConfig)}
          style={{
            fontSize: 11,
            color: '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
          }}
        >
          <span>API Config ({apiBaseUrl})</span>
          <span>{showApiConfig ? '▲' : '▼'}</span>
        </div>
        {showApiConfig && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrlState(e.target.value)}
              placeholder="http://localhost:8000"
              style={{
                flex: 1,
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => {
                setApiBaseUrl(apiBaseUrl);
                setMessage('API base URL saved.');
              }}
              style={{
                padding: '6px 10px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>

      {mode === 'generate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, color: '#4b5563' }}>
            Topic
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis"
              style={{
                width: '100%',
                marginTop: 6,
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </label>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 4,
              backgroundColor: loading || !topic.trim() ? '#9ca3af' : '#10b981',
              color: '#ffffff',
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Generating...' : 'Generate Courseware'}
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            Current page: <strong>{currentPage?.name ?? 'None'}</strong>
          </div>
          <label style={{ fontSize: 12, color: '#4b5563' }}>
            Instruction
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Add a summary note at the bottom"
              rows={4}
              style={{
                width: '100%',
                marginTop: 6,
                padding: '6px 8px',
                fontSize: 12,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </label>
          <button
            onClick={handleEditPage}
            disabled={loading || !instruction.trim() || !currentPage}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 4,
              backgroundColor: loading || !instruction.trim() || !currentPage ? '#9ca3af' : '#3b82f6',
              color: '#ffffff',
              cursor: loading || !instruction.trim() || !currentPage ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Applying...' : 'Apply Changes'}
          </button>
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: 16,
            padding: '8px 12px',
            fontSize: 12,
            borderRadius: 4,
            backgroundColor: '#dbeafe',
            color: '#1e40af',
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
