export * from './animation';
import type { AnimationConfig } from './animation';

// Shared TypeScript types for the entire project

// ============================================================================
// Element Types
// ============================================================================

export type ElementType = 'shape' | 'text' | 'image' | 'group' | string;

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
  /** Element source: 'user' for manually created, 'ai' for AI-generated */
  source?: 'user' | 'ai';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  parentId: string | null;
  childrenIds: string[];
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType:
    | 'rectangle'
    | 'circle'
    | 'triangle'
    | 'rounded-rectangle'
    | 'line'
    | 'arrow'
    | 'polygon'
    | 'star'
    | 'pentagon'
    | 'hexagon'
    | 'octagon'
    | 'star-5'
    | 'star-6';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
  sides?: number;
  starPoints?: number;
  starInnerRadius?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
}

export interface GroupElement extends BaseElement {
  type: 'group';
}

export type Element = ShapeElement | TextElement | ImageElement | GroupElement;

// ============================================================================
// Document, Node, Page & Structure Types
// ============================================================================

export type StructureItem = { type: 'node'; id: string } | { type: 'page'; id: string };

export interface Node {
  id: string;
  name: string;
}

export const PAGE_DEFAULT_WIDTH = 960;
export const PAGE_DEFAULT_HEIGHT = 540;

export interface PageBackgroundSolid {
  type: 'solid';
  color: string;
}

export interface PageBackgroundGradient {
  type: 'gradient';
  angle: number;
  stops: { offset: number; color: string }[];
}

export interface PageBackgroundImage {
  type: 'image';
  src: string;
  fit: 'cover' | 'contain' | 'fill';
  opacity: number;
}

export type PageBackground = PageBackgroundSolid | PageBackgroundGradient | PageBackgroundImage;

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type PageKind = 'normal' | 'video';

export interface VideoPageConfig {
  /** 视频源：可为 http(s) URL 或 blob: URL */
  src: string;
  /** 视频时长（秒），由 loadedmetadata 写回 */
  duration?: number;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export interface Page {
  id: string;
  name: string;
  /** 页面类型，默认 'normal'。'video' 表示视频页 */
  kind?: PageKind;
  /** 视频页配置，仅当 kind === 'video' 时使用 */
  video?: VideoPageConfig;
  background?: PageBackground;
  elements: Record<string, Element>;
  animations: Record<string, AnimationConfig>;
}

export interface Document {
  id: string;
  name: string;
  pages: Record<string, Page>;
  nodes: Record<string, Node>;
  structureItems: StructureItem[];
  currentPageId: string;
  background: PageBackground;
  safeArea: SafeArea;
}

// ============================================================================
// Snap & Guide Types
// ============================================================================

export interface Guide {
  type: 'horizontal' | 'vertical';
  kind: 'edge' | 'center' | 'spacing';
  position: number;
  sourceId: string;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

// ============================================================================
// Command Type
// ============================================================================

export interface Command {
  execute(): void;
  undo(): void;
}

// ============================================================================
// Animation Types
// ============================================================================

export type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Keyframe {
  id: string;
  time: number;
  value: number | string;
  easing: EasingFunction;
}

export interface Animation {
  id: string;
  elementId: string;
  property: string;
  keyframes: Keyframe[];
}

// ============================================================================
// Editor State (separated from scene data per Architecture Rule 3)
// ============================================================================

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export type ToolMode = 'select' | 'pan' | 'shape' | 'text' | 'image';

export interface EditorState {
  selectedElementIds: string[];
  viewport: Viewport;
  toolMode: ToolMode;
  hoveredElementId: string | null;
}

export function createMockEditorState(): EditorState {
  return {
    selectedElementIds: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    toolMode: 'select',
    hoveredElementId: null,
  };
}
