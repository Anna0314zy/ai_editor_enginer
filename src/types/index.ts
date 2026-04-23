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
// Document & Slide Types
// ============================================================================

export interface Slide {
  id: string;
  name: string;
  elementIds: string[];
  order: number;
  background: string;
}

export interface Document {
  id: string;
  name: string;
  elements: Record<string, Element>;
  slides: Record<string, Slide>;
  currentSlideId: string;
  slideOrder: string[];
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

// ============================================================================
// Mock Data
// ============================================================================

export function createMockDocument(): Document {
  const shapeEl: ShapeElement = {
    id: 'el-1',
    type: 'shape',
    name: 'Blue Rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
    shapeType: 'rectangle',
    fill: '#3b82f6',
    stroke: '#1d4ed8',
    strokeWidth: 2,
  };

  const textEl: TextElement = {
    id: 'el-2',
    type: 'text',
    name: 'Title Text',
    x: 120,
    y: 120,
    width: 160,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
    text: 'Hello Slides',
    fontSize: 24,
    fontFamily: 'Inter, sans-serif',
    color: '#ffffff',
    align: 'center',
  };

  const imageEl: ImageElement = {
    id: 'el-3',
    type: 'image',
    name: 'Hero Image',
    x: 400,
    y: 100,
    width: 300,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    parentId: null,
    childrenIds: [],
    src: 'https://via.placeholder.com/300x200',
    objectFit: 'cover',
  };

  const slide1: Slide = {
    id: 'slide-1',
    name: 'Slide 1',
    elementIds: [shapeEl.id, textEl.id, imageEl.id],
    order: 0,
    background: '#f8fafc',
  };

  return {
    id: 'doc-1',
    name: 'My Presentation',
    elements: {
      [shapeEl.id]: shapeEl,
      [textEl.id]: textEl,
      [imageEl.id]: imageEl,
    },
    slides: {
      [slide1.id]: slide1,
    },
    currentSlideId: slide1.id,
    slideOrder: [slide1.id],
  };
}

export function createMockAnimations(): Animation[] {
  return [
    {
      id: 'anim-1',
      elementId: 'el-1',
      property: 'x',
      keyframes: [
        { id: 'kf-1', time: 0, value: 100, easing: 'linear' },
        { id: 'kf-2', time: 1000, value: 400, easing: 'ease-out' },
      ],
    },
    {
      id: 'anim-2',
      elementId: 'el-2',
      property: 'opacity',
      keyframes: [
        { id: 'kf-3', time: 0, value: 0, easing: 'linear' },
        { id: 'kf-4', time: 500, value: 1, easing: 'ease-in' },
      ],
    },
  ];
}

export function createMockEditorState(): EditorState {
  return {
    selectedElementIds: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    toolMode: 'select',
    hoveredElementId: null,
  };
}
