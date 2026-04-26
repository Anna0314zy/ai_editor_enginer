import type { Command, Element, AnimationConfig } from '../types';
import type { Scene } from './scene';

export class AddElementCommand implements Command {
  constructor(
    private scene: Scene,
    private slideId: string,
    private element: Element
  ) {}

  execute(): void {
    this.scene.addElement(this.slideId, this.element);
  }

  undo(): void {
    this.scene.deleteElement(this.element.id);
  }
}

export class MoveElementCommand implements Command {
  private before: Partial<Element>;

  constructor(
    private scene: Scene,
    private elementId: string,
    private updates: Partial<Omit<Element, 'id' | 'type'>>
  ) {
    const el = this.scene.getElement(this.elementId);
    this.before = {};
    if (el) {
      for (const key of Object.keys(this.updates) as Array<keyof typeof this.updates>) {
        (this.before as Record<string, unknown>)[key] = (el as unknown as Record<string, unknown>)[key];
      }
    }
  }

  execute(): void {
    this.scene.updateElement(this.elementId, this.updates);
  }

  undo(): void {
    this.scene.updateElement(this.elementId, this.before);
  }
}

export class DeleteElementCommand implements Command {
  private deletedElement: Element | undefined;

  constructor(
    private scene: Scene,
    private elementId: string,
    private slideId: string
  ) {
    this.deletedElement = this.scene.getElement(this.elementId);
  }

  execute(): void {
    this.scene.deleteElement(this.elementId);
  }

  undo(): void {
    if (this.deletedElement) {
      this.scene.addElement(this.slideId, this.deletedElement);
    }
  }
}

// ============================================================================
// Animation Commands
// ============================================================================

export class AddAnimationCommand implements Command {
  constructor(
    private scene: Scene,
    private slideId: string,
    private config: AnimationConfig
  ) {}

  execute(): void {
    this.scene.addAnimation(this.slideId, this.config);
  }

  undo(): void {
    this.scene.removeAnimation(this.config.id);
  }
}

export class RemoveAnimationCommand implements Command {
  private removedConfig: AnimationConfig | undefined;
  private slideId: string;
  private prevIndex: number;

  constructor(private scene: Scene, private configId: string) {
    const doc = scene.getDocument();
    this.removedConfig = doc.animations[configId];
    // Find which slide owns this animation
    let foundSlideId = '';
    let foundIndex = -1;
    for (const slide of Object.values(doc.slides)) {
      const idx = slide.animationIds.indexOf(configId);
      if (idx >= 0) {
        foundSlideId = slide.id;
        foundIndex = idx;
        break;
      }
    }
    this.slideId = foundSlideId;
    this.prevIndex = foundIndex;
  }

  execute(): void {
    this.scene.removeAnimation(this.configId);
  }

  undo(): void {
    if (!this.removedConfig) return;
    this.scene.addAnimation(this.slideId, this.removedConfig);
    // Restore original position
    const slide = this.scene.getDocument().slides[this.slideId];
    if (slide && this.prevIndex >= 0) {
      slide.animationIds = slide.animationIds.filter((id) => id !== this.configId);
      slide.animationIds.splice(this.prevIndex, 0, this.configId);
    }
  }
}

export class UpdateAnimationCommand implements Command {
  private before: Partial<AnimationConfig>;

  constructor(
    private scene: Scene,
    private configId: string,
    private updates: Partial<AnimationConfig>
  ) {
    const existing = scene.getAnimation(configId);
    this.before = {};
    if (existing) {
      for (const key of Object.keys(updates) as Array<keyof typeof updates>) {
        (this.before as Record<string, unknown>)[key] = (existing as unknown as Record<string, unknown>)[key];
      }
    }
  }

  execute(): void {
    this.scene.updateAnimation(this.configId, this.updates);
  }

  undo(): void {
    this.scene.updateAnimation(this.configId, this.before);
  }
}

export class ReorderAnimationsCommand implements Command {
  private beforeIds: string[];

  constructor(
    private scene: Scene,
    private slideId: string,
    private afterIds: string[]
  ) {
    const slide = scene.getDocument().slides[slideId];
    this.beforeIds = slide ? [...slide.animationIds] : [];
  }

  execute(): void {
    this.scene.reorderAnimations(this.slideId, this.afterIds);
  }

  undo(): void {
    this.scene.reorderAnimations(this.slideId, this.beforeIds);
  }
}
