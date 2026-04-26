import type { Document, Element, Slide, AnimationConfig } from '../types';

export class Scene {
  private document: Document;

  constructor(document?: Document) {
    this.document = document ?? createEmptyDocument();
  }

  getDocument(): Document {
    return this.document;
  }

  // ============================================================================
  // Animation CRUD
  // ============================================================================

  addAnimation(slideId: string, config: AnimationConfig): void {
    const slide = this.document.slides[slideId];
    if (!slide) return;

    this.document.animations[config.id] = config;
    if (!slide.animationIds.includes(config.id)) {
      slide.animationIds.push(config.id);
    }
  }

  removeAnimation(configId: string): void {
    const config = this.document.animations[configId];
    if (!config) return;

    delete this.document.animations[configId];

    for (const slide of Object.values(this.document.slides)) {
      slide.animationIds = slide.animationIds.filter((id) => id !== configId);
    }
  }

  updateAnimation(configId: string, updates: Partial<AnimationConfig>): void {
    const config = this.document.animations[configId];
    if (!config) return;
    Object.assign(config, updates);
  }

  getAnimation(configId: string): AnimationConfig | undefined {
    return this.document.animations[configId];
  }

  getSlideAnimations(slideId: string): AnimationConfig[] {
    const slide = this.document.slides[slideId];
    if (!slide) return [];

    return slide.animationIds
      .map((id) => this.document.animations[id])
      .filter((c): c is AnimationConfig => c !== undefined);
  }

  reorderAnimations(slideId: string, orderedIds: string[]): void {
    const slide = this.document.slides[slideId];
    if (!slide) return;
    slide.animationIds = orderedIds;
  }

  addElement(slideId: string, element: Element): void {
    const slide = this.document.slides[slideId];
    if (!slide) {
      return;
    }

    // Store element
    this.document.elements[element.id] = element;

    // Add to slide
    if (!slide.elementIds.includes(element.id)) {
      slide.elementIds.push(element.id);
    }

    // Maintain group hierarchy consistency
    if (element.parentId) {
      const parent = this.document.elements[element.parentId];
      if (parent && parent.type === 'group' && !parent.childrenIds.includes(element.id)) {
        parent.childrenIds.push(element.id);
      }
    }
  }

  updateElement(
    elementId: string,
    updates: Partial<Omit<Element, 'id' | 'type'>>
  ): void {
    const element = this.document.elements[elementId];
    if (!element) {
      return;
    }

    const prevParentId = element.parentId;

    // Apply updates
    Object.assign(element, updates);

    // Handle parentId change for group hierarchy consistency
    if ('parentId' in updates && updates.parentId !== prevParentId) {
      // Remove from old parent's childrenIds
      if (prevParentId) {
        const oldParent = this.document.elements[prevParentId];
        if (oldParent) {
          oldParent.childrenIds = oldParent.childrenIds.filter((id) => id !== elementId);
        }
      }

      // Add to new parent's childrenIds
      if (element.parentId) {
        const newParent = this.document.elements[element.parentId];
        if (newParent && newParent.type === 'group' && !newParent.childrenIds.includes(elementId)) {
          newParent.childrenIds.push(elementId);
        }
      }
    }
  }

  deleteElement(elementId: string): void {
    const element = this.document.elements[elementId];
    if (!element) {
      return;
    }

    // Remove from parent group's childrenIds
    if (element.parentId) {
      const parent = this.document.elements[element.parentId];
      if (parent) {
        parent.childrenIds = parent.childrenIds.filter((id) => id !== elementId);
      }
    }

    // Remove from any child elements' parentId
    for (const childId of element.childrenIds) {
      const child = this.document.elements[childId];
      if (child) {
        child.parentId = null;
      }
    }

    // Remove from all slides that reference it
    for (const slide of Object.values(this.document.slides)) {
      slide.elementIds = slide.elementIds.filter((id) => id !== elementId);
    }

    // Remove element itself
    delete this.document.elements[elementId];
  }

  getElement(elementId: string): Element | undefined {
    return this.document.elements[elementId];
  }

  getSlideElements(slideId: string): Element[] {
    const slide = this.document.slides[slideId];
    if (!slide) {
      return [];
    }

    return slide.elementIds
      .map((id) => this.document.elements[id])
      .filter((el): el is Element => el !== undefined);
  }

  // Additional utility for internal use or consumers
  getSlide(slideId: string): Slide | undefined {
    return this.document.slides[slideId];
  }
}

function createEmptyDocument(): Document {
  const defaultSlideId = 'slide-default';
  return {
    id: 'doc-default',
    name: 'Untitled',
    elements: {},
    slides: {
      [defaultSlideId]: {
        id: defaultSlideId,
        name: 'Slide 1',
        elementIds: [],
        animationIds: [],
        order: 0,
        background: '#ffffff',
      },
    },
    animations: {},
    currentSlideId: defaultSlideId,
    slideOrder: [defaultSlideId],
  };
}

export function createScene(document?: Document): Scene {
  return new Scene(document);
}
