import type { ComponentDescriptor, ComponentRenderProps, EnginePlugin } from '../../engine/pluginRegistry';
import type { Element } from '../../types';
import type { MouseEvent } from 'react';

function createDefaultElement(x: number, y: number): Element {
  return {
    id: `video_${Date.now()}`,
    name: 'Video',
    type: 'video',
    x,
    y,
    width: 400,
    height: 225,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    autoplay: false,
    controls: true,
  } as unknown as Element;
}

function render(element: Element, props: ComponentRenderProps): React.ReactNode {
  const el = element as unknown as { src: string; autoplay?: boolean; controls?: boolean };
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.x + (props.offsetX ?? 0),
    top: element.y + (props.offsetY ?? 0),
    width: element.width,
    height: element.height,
    transform: `rotate(${props.rotation ?? element.rotation}deg)`,
    opacity: element.opacity,
    display: element.visible ? 'block' : 'none',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  };

  return (
    <div
      key={element.id}
      data-element-id={element.id}
      style={baseStyle}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(element.id);
      }}
      onMouseDown={(e: MouseEvent) => props.onMouseDown?.(e, element.id)}
    >
      <video
        src={el.src}
        autoPlay={el.autoplay}
        controls={el.controls}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {props.isSelected && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            border: '2px solid #3b82f6',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

function renderThumbnail(_element: Element): React.ReactNode {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        color: '#9ca3af',
        fontSize: 12,
      }}
    >
      ▶ Video
    </div>
  );
}

const videoDescriptor: ComponentDescriptor = {
  type: 'video',
  label: 'Video',
  icon: '🎬',
  createDefaultElement,
  render,
  renderThumbnail,
};

export const videoPlugin: EnginePlugin = {
  id: 'video',
  name: 'Video Plugin',
  version: '1.0.0',
  enabled: true,
  components: [videoDescriptor],
};
