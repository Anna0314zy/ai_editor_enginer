/**
 * Backend AI Data Contract
 *
 * This file defines the exact JSON structure that the backend AI service
 * should return. The frontend will validate and transform these payloads
 * into engine Commands.
 *
 * Canvas baseline: 960 x 540 (top-left origin)
 */

import type {
  AnimationType,
  AnimationEffect,
  StartType,
  EasingPreset,
  AnimationParams,
} from '../../types/animation';

// ============================================================================
// Animation Schema (simplified — id/elementId are auto-filled by frontend)
// ============================================================================

export interface BackendAnimationConfig {
  name?: string;
  type: AnimationType;
  effect: AnimationEffect;
  startType?: StartType;
  duration?: number;
  delay?: number;
  easing?: EasingPreset;
  repeatCount?: number;
  params?: AnimationParams;
}

// ============================================================================
// Element Schemas (backend only needs to provide the fields below)
// ============================================================================

interface BackendElementBase {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Element source: 'ai' marks AI-generated, omit or 'user' for manual */
  source?: 'user' | 'ai';
  /** Optional animation configs attached to this element */
  animations?: BackendAnimationConfig[];
}

export interface BackendTextElement extends BackendElementBase {
  type: 'text';
  /** Text content */
  text: string;
  /** Font size in px (default: 24) */
  fontSize?: number;
  /** Font family (default: 'Arial, sans-serif') */
  fontFamily?: string;
  /** Text color hex (default: '#1f2937') */
  color?: string;
  /** Horizontal alignment (default: 'left') */
  align?: 'left' | 'center' | 'right';
}

export interface BackendShapeElement extends BackendElementBase {
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
  /** Fill color hex (default: '#e5e7eb') */
  fill?: string;
  /** Stroke color hex (default: 'transparent') */
  stroke?: string;
  /** Stroke width (default: 0) */
  strokeWidth?: number;
  /** Corner radius for rounded-rectangle */
  cornerRadius?: number;
}

export interface BackendImageElement extends BackendElementBase {
  type: 'image';
  /** Image URL */
  src: string;
  /** Object fit (default: 'cover') */
  objectFit?: 'cover' | 'contain' | 'fill';
}

export type BackendElement =
  | BackendTextElement
  | BackendShapeElement
  | BackendImageElement;

// ============================================================================
// Slide / Page Generation Schema
// ============================================================================

import type { PageBackground } from '../../types';

export interface BackendSlide {
  /** Page title (becomes Page.name) */
  title: string;
  /** Page background config */
  background?: PageBackground;
  /** Elements to render on this page */
  elements: BackendElement[];
}

export interface GenerateCoursewareResponse {
  slides: BackendSlide[];
}

// ============================================================================
// Page Edit Schema
// ============================================================================

export interface ElementUpdate {
  /** Existing element id (provided by frontend in the request context) */
  id: string;
  /** Partial update payload */
  updates: Record<string, unknown>;
}

export interface EditPageResponse {
  /** New elements to append */
  elementsToAdd: BackendElement[];
  /** Existing elements to modify */
  elementsToUpdate: ElementUpdate[];
  /** Existing element ids to delete */
  elementsToRemove: string[];
}

// ============================================================================
// Frontend Request Types (for reference)
// ============================================================================

export interface GenerateCoursewareRequest {
  topic: string;
}

export interface EditPageRequest {
  /** The current page object (includes existing elements with ids) */
  page: {
    id: string;
    name: string;
    elements: Record<string, unknown>;
  };
  /** Natural language instruction, e.g. "add a summary at the bottom" */
  instruction: string;
}
