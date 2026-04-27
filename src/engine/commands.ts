import type { Command, Element, AnimationConfig, Page, Node, StructureItem } from '../types';
import type { Scene } from './scene';

export class AddElementCommand implements Command {
  constructor(
    private scene: Scene,
    private pageId: string,
    private element: Element
  ) {}

  execute(): void {
    this.scene.addElement(this.pageId, this.element);
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
  private pageId: string;

  constructor(
    private scene: Scene,
    private elementId: string,
    pageId: string
  ) {
    this.deletedElement = this.scene.getElement(this.elementId);
    this.pageId = pageId;
  }

  execute(): void {
    this.scene.deleteElement(this.elementId);
  }

  undo(): void {
    if (this.deletedElement) {
      this.scene.addElement(this.pageId, this.deletedElement);
    }
  }
}

// ============================================================================
// Animation Commands
// ============================================================================

export class AddAnimationCommand implements Command {
  constructor(
    private scene: Scene,
    private pageId: string,
    private config: AnimationConfig
  ) {}

  execute(): void {
    this.scene.addAnimation(this.pageId, this.config);
  }

  undo(): void {
    this.scene.removeAnimation(this.config.id);
  }
}

export class RemoveAnimationCommand implements Command {
  private removedConfig: AnimationConfig | undefined;
  private pageId: string = '';

  constructor(private scene: Scene, private configId: string) {
    for (const page of Object.values(scene.getDocument().pages)) {
      const config = page.animations[configId];
      if (config) {
        this.removedConfig = config;
        this.pageId = page.id;
        break;
      }
    }
  }

  execute(): void {
    this.scene.removeAnimation(this.configId);
  }

  undo(): void {
    if (!this.removedConfig) return;
    this.scene.addAnimation(this.pageId, this.removedConfig);
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
    private pageId: string,
    private afterIds: string[]
  ) {
    const page = scene.getDocument().pages[pageId];
    this.beforeIds = page ? Object.keys(page.animations) : [];
  }

  execute(): void {
    this.scene.reorderAnimations(this.pageId, this.afterIds);
  }

  undo(): void {
    this.scene.reorderAnimations(this.pageId, this.beforeIds);
  }
}

// ============================================================================
// Page / Node / Structure Commands
// ============================================================================

export class AddPageCommand implements Command {
  private prevCurrentPageId: string;

  constructor(
    private scene: Scene,
    private page: Page,
    private setCurrent: boolean = true
  ) {
    this.prevCurrentPageId = scene.getDocument().currentPageId;
  }

  execute(): void {
    this.scene.addPage(this.page);
    if (this.setCurrent) {
      this.scene.setCurrentPageId(this.page.id);
    }
  }

  undo(): void {
    this.scene.removePage(this.page.id);
    this.scene.setCurrentPageId(this.prevCurrentPageId);
  }
}

export class RemovePageCommand implements Command {
  private removedPage: Page | undefined;
  private removedIndex: number;
  private prevCurrentPageId: string;

  constructor(private scene: Scene, private pageId: string) {
    const doc = scene.getDocument();
    this.removedPage = doc.pages[pageId];
    this.removedIndex = doc.structureItems.findIndex(
      (item) => item.type === 'page' && item.id === pageId
    );
    this.prevCurrentPageId = doc.currentPageId;
  }

  execute(): void {
    this.scene.removePage(this.pageId);
  }

  undo(): void {
    if (!this.removedPage) return;
    this.scene.addPage(
      this.removedPage,
      this.removedIndex >= 0 ? this.removedIndex : undefined
    );
    this.scene.setCurrentPageId(this.prevCurrentPageId);
  }
}

export class AddNodeCommand implements Command {
  constructor(
    private scene: Scene,
    private node: Node,
    private targetPageId?: string
  ) {}

  execute(): void {
    this.scene.addNode(this.node, this.targetPageId);
  }

  undo(): void {
    this.scene.removeNode(this.node.id);
  }
}

export class RemoveNodeCommand implements Command {
  private removedNode: Node | undefined;
  private targetPageId: string | undefined;

  constructor(private scene: Scene, private nodeId: string) {
    const doc = scene.getDocument();
    this.removedNode = doc.nodes[nodeId];

    const index = doc.structureItems.findIndex(
      (item) => item.type === 'node' && item.id === nodeId
    );
    if (index >= 0) {
      for (let i = index + 1; i < doc.structureItems.length; i++) {
        if (doc.structureItems[i].type === 'page') {
          this.targetPageId = doc.structureItems[i].id;
          break;
        }
      }
    }
  }

  execute(): void {
    this.scene.removeNode(this.nodeId);
  }

  undo(): void {
    if (!this.removedNode) return;
    this.scene.addNode(this.removedNode, this.targetPageId);
  }
}

export class ReorderStructureItemsCommand implements Command {
  private beforeOrder: StructureItem[];

  constructor(private scene: Scene, private afterOrder: StructureItem[]) {
    this.beforeOrder = [...scene.getDocument().structureItems];
  }

  execute(): void {
    this.scene.reorderStructureItems(this.afterOrder);
  }

  undo(): void {
    this.scene.reorderStructureItems(this.beforeOrder);
  }
}
