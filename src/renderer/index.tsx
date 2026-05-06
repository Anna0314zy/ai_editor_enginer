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

function getPolygonPoints(cx: number, cy: number, radius: number, sides: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

function getStarPoints(cx: number, cy: number, outerRadius: number, innerRadius: number, points: number): string {
  const coords: string[] = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const angle = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    coords.push(`${x},${y}`);
  }
  return coords.join(' ');
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
    case 'rounded-rectangle': {
      const r = element.cornerRadius ?? 0;
      shape = (
        <rect
          x={half}
          y={half}
          width={Math.max(0, w - sw)}
          height={Math.max(0, h - sw)}
          rx={Math.max(0, r)}
          ry={Math.max(0, r)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'line': {
      shape = (
        <line
          x1={half}
          y1={h / 2}
          x2={w - half}
          y2={h / 2}
          stroke={element.stroke}
          strokeWidth={sw}
          fill="none"
        />
      );
      break;
    }
    case 'arrow': {
      const arrowSize = Math.min(Math.max(0, h - sw), w * 0.3);
      const lineEndX = w - half - arrowSize;
      shape = (
        <g>
          <line
            x1={half}
            y1={h / 2}
            x2={Math.max(half, lineEndX)}
            y2={h / 2}
            stroke={element.stroke}
            strokeWidth={sw}
          />
          <polygon
            points={`${Math.max(half, lineEndX)},${h / 2 - arrowSize / 2} ${w - half},${h / 2} ${Math.max(half, lineEndX)},${h / 2 + arrowSize / 2}`}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={sw}
          />
        </g>
      );
      break;
    }
    case 'polygon': {
      const sides = Math.max(3, element.sides ?? 6);
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, sides)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'star': {
      const points = Math.max(2, element.starPoints ?? 5);
      const innerRatio = Math.max(0, Math.min(1, element.starInnerRadius ?? 0.5));
      const outerRadius = Math.max(0, Math.min(w, h) / 2 - half);
      const innerRadius = outerRadius * innerRatio;
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getStarPoints(cx, cy, outerRadius, innerRadius, points)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'pentagon': {
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, 5)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'hexagon': {
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, 6)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'octagon': {
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, 8)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'star-5': {
      const outerRadius = Math.max(0, Math.min(w, h) / 2 - half);
      const innerRadius = outerRadius * 0.5;
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getStarPoints(cx, cy, outerRadius, innerRadius, 5)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'star-6': {
      const outerRadius = Math.max(0, Math.min(w, h) / 2 - half);
      const innerRadius = outerRadius * 0.5;
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getStarPoints(cx, cy, outerRadius, innerRadius, 6)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
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
      <img
        src={element.src}
        alt={element.name}
        style={style}
        draggable={false}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.fallback) {
            img.dataset.fallback = 'true';
            img.src = placeholderImageDataUri();
          }
        }}
      />
      {props.isSelected && <SelectionOutline />}
    </div>
  );
}

export function placeholderImageDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">
    <rect width="200" height="150" fill="#e5e7eb"/>
    <rect x="70" y="50" width="60" height="45" rx="4" fill="#9ca3af" opacity="0.6"/>
    <circle cx="90" cy="68" r="8" fill="#d1d5db"/>
    <polygon points="85,82 95,72 105,82 110,77 120,95 80,95" fill="#d1d5db"/>
    <text x="100" y="125" text-anchor="middle" font-size="12" fill="#6b7280" font-family="sans-serif">Image Placeholder</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
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
    case 'rounded-rectangle': {
      const r = element.cornerRadius ?? 0;
      shape = (
        <rect
          x={half}
          y={half}
          width={Math.max(0, w - sw)}
          height={Math.max(0, h - sw)}
          rx={Math.max(0, r)}
          ry={Math.max(0, r)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'line': {
      shape = (
        <line
          x1={half}
          y1={h / 2}
          x2={w - half}
          y2={h / 2}
          stroke={element.stroke}
          strokeWidth={sw}
          fill="none"
        />
      );
      break;
    }
    case 'arrow': {
      const arrowSize = Math.min(Math.max(0, h - sw), w * 0.3);
      const lineEndX = w - half - arrowSize;
      shape = (
        <g>
          <line
            x1={half}
            y1={h / 2}
            x2={Math.max(half, lineEndX)}
            y2={h / 2}
            stroke={element.stroke}
            strokeWidth={sw}
          />
          <polygon
            points={`${Math.max(half, lineEndX)},${h / 2 - arrowSize / 2} ${w - half},${h / 2} ${Math.max(half, lineEndX)},${h / 2 + arrowSize / 2}`}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={sw}
          />
        </g>
      );
      break;
    }
    case 'polygon': {
      const sides = Math.max(3, element.sides ?? 6);
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, sides)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'star': {
      const points = Math.max(2, element.starPoints ?? 5);
      const innerRatio = Math.max(0, Math.min(1, element.starInnerRadius ?? 0.5));
      const outerRadius = Math.max(0, Math.min(w, h) / 2 - half);
      const innerRadius = outerRadius * innerRatio;
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getStarPoints(cx, cy, outerRadius, innerRadius, points)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'pentagon': {
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, 5)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'hexagon': {
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, 6)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'octagon': {
      const radius = Math.max(0, Math.min(w, h) / 2 - half);
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getPolygonPoints(cx, cy, radius, 8)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'star-5': {
      const outerRadius = Math.max(0, Math.min(w, h) / 2 - half);
      const innerRadius = outerRadius * 0.5;
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getStarPoints(cx, cy, outerRadius, innerRadius, 5)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
    case 'star-6': {
      const outerRadius = Math.max(0, Math.min(w, h) / 2 - half);
      const innerRadius = outerRadius * 0.5;
      const cx = w / 2;
      const cy = h / 2;
      shape = (
        <polygon
          points={getStarPoints(cx, cy, outerRadius, innerRadius, 6)}
          fill={element.fill}
          stroke={element.stroke}
          strokeWidth={sw}
        />
      );
      break;
    }
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
      <img
        src={element.src}
        alt={element.name}
        style={style}
        draggable={false}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.fallback) {
            img.dataset.fallback = 'true';
            img.src = placeholderImageDataUri();
          }
        }}
      />
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
