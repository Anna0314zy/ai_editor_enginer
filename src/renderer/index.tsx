import type { CSSProperties, ReactNode } from 'react';
import type { MouseEvent } from 'react';
import type { Element, ShapeElement, TextElement, ImageElement } from '../types';

export interface RenderProps {
  onClick?: (id: string) => void;
  onMouseDown?: (e: MouseEvent, id: string) => void;
  isSelected?: boolean;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}

function getBaseStyle(element: Element, offsetX = 0, offsetY = 0, rotation?: number): CSSProperties {
  return {
    position: 'absolute',
    left: element.x + offsetX,
    top: element.y + offsetY,
    width: element.width,
    height: element.height,
    transform: `rotate(${rotation ?? element.rotation}deg)`,
    opacity: element.opacity,
    display: element.visible ? 'block' : 'none',
    pointerEvents: 'auto',
    boxSizing: 'border-box',
  };
}

function renderShape(element: ShapeElement, props: RenderProps): ReactNode {
  const w = element.width;
  const h = element.height;
  const sw = element.strokeWidth;
  const half = sw / 2;

  let shape: ReactNode;
  switch (element.shapeType) {
    case 'rectangle':
      shape = (
        <rect
          x={half}
          y={half}
          width={Math.max(0, w - sw)}
          height={Math.max(0, h - sw)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    case 'circle':
      shape = (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0, (w - sw) / 2)}
          ry={Math.max(0, (h - sw) / 2)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    case 'triangle':
      shape = (
        <polygon
          points={`${w / 2},${half} ${half},${h - half} ${w - half},${h - half}`}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
  }

  return (
    <div
      key={element.id}
      data-element-id={element.id}
      style={getBaseStyle(element, props.offsetX, props.offsetY, props.rotation)}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(element.id);
      }}
      onMouseDown={(e) => props.onMouseDown?.(e, element.id)}
    >
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        {shape}
      </svg>
      {props.isSelected && <SelectionOutline />}
    </div>
  );
}

function renderText(element: TextElement, props: RenderProps): ReactNode {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    color: element.color,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    padding: '4px',
  };

  return (
    <div
      key={element.id}
      data-element-id={element.id}
      style={getBaseStyle(element, props.offsetX, props.offsetY, props.rotation)}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(element.id);
      }}
      onMouseDown={(e) => props.onMouseDown?.(e, element.id)}
    >
      <div style={style}>{element.text}</div>
      {props.isSelected && <SelectionOutline />}
    </div>
  );
}

function renderImage(element: ImageElement, props: RenderProps): ReactNode {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: element.objectFit,
  };

  return (
    <div
      key={element.id}
      data-element-id={element.id}
      style={getBaseStyle(element, props.offsetX, props.offsetY, props.rotation)}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick?.(element.id);
      }}
      onMouseDown={(e) => props.onMouseDown?.(e, element.id)}
    >
      <img src={element.src} alt={element.name} style={style} draggable={false} />
      {props.isSelected && <SelectionOutline />}
    </div>
  );
}

function SelectionOutline(): ReactNode {
  return (
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
  );
}

export function renderElement(element: Element, props?: RenderProps): ReactNode {
  switch (element.type) {
    case 'shape':
      return renderShape(element, props ?? {});
    case 'text':
      return renderText(element, props ?? {});
    case 'image':
      return renderImage(element, props ?? {});
    case 'group':
      return null;
    default:
      return null;
  }
}

// ============================================================================
// Lightweight Thumbnail Renderer (no data-element-id, no events, no selection)
// ============================================================================

function renderThumbnailShape(element: ShapeElement): ReactNode {
  const w = element.width;
  const h = element.height;
  const sw = element.strokeWidth;
  const half = sw / 2;

  let shape: ReactNode;
  switch (element.shapeType) {
    case 'rectangle':
      shape = (
        <rect
          x={half}
          y={half}
          width={Math.max(0, w - sw)}
          height={Math.max(0, h - sw)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    case 'circle':
      shape = (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0, (w - sw) / 2)}
          ry={Math.max(0, (h - sw) / 2)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    case 'triangle':
      shape = (
        <polygon
          points={`${w / 2},${half} ${half},${h - half} ${w - half},${h - half}`}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
  }

  return (
    <div key={element.id} style={getBaseStyle(element)}>
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        {shape}
      </svg>
    </div>
  );
}

function renderThumbnailText(element: TextElement): ReactNode {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
    fontSize: element.fontSize,
    fontFamily: element.fontFamily,
    color: element.color,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    padding: '4px',
  };

  return (
    <div key={element.id} style={getBaseStyle(element)}>
      <div style={style}>{element.text}</div>
    </div>
  );
}

function renderThumbnailImage(element: ImageElement): ReactNode {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: element.objectFit,
  };

  return (
    <div key={element.id} style={getBaseStyle(element)}>
      <img src={element.src} alt={element.name} style={style} draggable={false} />
    </div>
  );
}

export function renderThumbnail(element: Element): ReactNode {
  switch (element.type) {
    case 'shape':
      return renderThumbnailShape(element);
    case 'text':
      return renderThumbnailText(element);
    case 'image':
      return renderThumbnailImage(element);
    case 'group':
      return null;
    default:
      return null;
  }
}
