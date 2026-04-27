export * from './animation';
import type { AnimationConfig } from './animation';

// Shared TypeScript types for the entire project

// ============================================================================
// Element Types
// ============================================================================

export type ElementType = 'shape' | 'text' | 'image' | 'group';

export interface BaseElement {
  id: string;
  type: ElementType;
  name: string;
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
  shapeType: 'rectangle' | 'circle' | 'triangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
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

export type StructureItem =
  | { type: 'node'; id: string }
  | { type: 'page'; id: string };

export interface Node {
  id: string;
  name: string;
}

export interface Page {
  id: string;
  name: string;
  background: string;
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
