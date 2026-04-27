import type { Document, Element, Page, Node, StructureItem, AnimationConfig } from '../types';

export class Scene {
  private document: Document;

  constructor(document?: Document) {
    this.document = document ?? createEmptyDocument();
  }

  getDocument(): Document {
    return this.document;
  }

  // ============================================================================
  // Page CRUD
  // ============================================================================

  addPage(page: Page, insertIndex?: number): void {
    this.document.pages[page.id] = page;
    const item: StructureItem = { type: 'page', id: page.id };
    if (insertIndex !== undefined && insertIndex >= 0) {
      this.document.structureItems.splice(insertIndex, 0, item);
    } else {
      this.document.structureItems.push(item);
    }
    if (!this.document.currentPageId) {
      this.document.currentPageId = page.id;
    }
  }

  removePage(pageId: string): void {
    delete this.document.pages[pageId];
    this.document.structureItems = this.document.structureItems.filter(
      (item) => !(item.type === 'page' && item.id === pageId)
    );
    if (this.document.currentPageId === pageId) {
      const firstPageItem = this.document.structureItems.find((item) => item.type === 'page');
      this.document.currentPageId = firstPageItem?.id ?? '';
    }
  }

  getPage(pageId: string): Page | undefined {
    return this.document.pages[pageId];
  }

  setCurrentPageId(pageId: string): void {
    if (this.document.pages[pageId]) {
      this.document.currentPageId = pageId;
    }
  }

  // ============================================================================
  // Node CRUD
  // ============================================================================

  addNode(node: Node, targetPageId?: string): void {
    this.document.nodes[node.id] = node;
    const item: StructureItem = { type: 'node', id: node.id };
    if (targetPageId) {
      const targetIndex = this.document.structureItems.findIndex(
        (si) => si.type === 'page' && si.id === targetPageId
      );
      if (targetIndex >= 0) {
        this.document.structureItems.splice(targetIndex, 0, item);
        return;
      }
    }
    this.document.structureItems.push(item);
  }

  removeNode(nodeId: string): void {
    delete this.document.nodes[nodeId];
    this.document.structureItems = this.document.structureItems.filter(
      (item) => !(item.type === 'node' && item.id === nodeId)
    );
  }

  getNode(nodeId: string): Node | undefined {
    return this.document.nodes[nodeId];
  }

  // ============================================================================
  // Structure Ordering
  // ============================================================================

  reorderStructureItems(newOrder: StructureItem[]): void {
    this.document.structureItems = newOrder;
  }

  // ============================================================================
  // Element CRUD (operates on current page's elements map)
  // ============================================================================

  addElement(pageId: string, element: Element): void {
    const page = this.document.pages[pageId];
    if (!page) return;

    page.elements[element.id] = element;

    if (element.parentId) {
      const parent = page.elements[element.parentId];
      if (parent && parent.type === 'group' && !parent.childrenIds.includes(element.id)) {
        parent.childrenIds.push(element.id);
      }
    }
  }

  updateElement(
    elementId: string,
    updates: Partial<Omit<Element, 'id' | 'type'>>
  ): void {
    const page = this.findPageContainingElement(elementId);
    if (!page) return;

    const element = page.elements[elementId];
    if (!element) return;

    const prevParentId = element.parentId;
    Object.assign(element, updates);

    if ('parentId' in updates && updates.parentId !== prevParentId) {
      if (prevParentId) {
        const oldParent = page.elements[prevParentId];
        if (oldParent) {
          oldParent.childrenIds = oldParent.childrenIds.filter((id) => id !== elementId);
        }
      }
      if (element.parentId) {
        const newParent = page.elements[element.parentId];
        if (newParent && newParent.type === 'group' && !newParent.childrenIds.includes(elementId)) {
          newParent.childrenIds.push(elementId);
        }
      }
    }
  }

  deleteElement(elementId: string): void {
    const page = this.findPageContainingElement(elementId);
    if (!page) return;

    const element = page.elements[elementId];
    if (!element) return;

    if (element.parentId) {
      const parent = page.elements[element.parentId];
      if (parent) {
        parent.childrenIds = parent.childrenIds.filter((id) => id !== elementId);
      }
    }

    for (const childId of element.childrenIds) {
      const child = page.elements[childId];
      if (child) {
        child.parentId = null;
      }
    }

    delete page.elements[elementId];
  }

  getElement(elementId: string): Element | undefined {
    for (const page of Object.values(this.document.pages)) {
      const el = page.elements[elementId];
      if (el) return el;
    }
    return undefined;
  }

  getPageElements(pageId: string): Element[] {
    const page = this.document.pages[pageId];
    if (!page) return [];
    return Object.values(page.elements);
  }

  // ============================================================================
  // Animation CRUD (operates on current page's animations map)
  // ============================================================================

  addAnimation(pageId: string, config: AnimationConfig): void {
    const page = this.document.pages[pageId];
    if (!page) return;
    page.animations[config.id] = config;
  }

  removeAnimation(configId: string): void {
    for (const page of Object.values(this.document.pages)) {
      if (page.animations[configId]) {
        delete page.animations[configId];
        break;
      }
    }
  }

  updateAnimation(configId: string, updates: Partial<AnimationConfig>): void {
    for (const page of Object.values(this.document.pages)) {
      const config = page.animations[configId];
      if (config) {
        Object.assign(config, updates);
        break;
      }
    }
  }

  getAnimation(configId: string): AnimationConfig | undefined {
    for (const page of Object.values(this.document.pages)) {
      const config = page.animations[configId];
      if (config) return config;
    }
    return undefined;
  }

  getPageAnimations(pageId: string): AnimationConfig[] {
    const page = this.document.pages[pageId];
    if (!page) return [];
    return Object.values(page.animations);
  }

  reorderAnimations(pageId: string, orderedIds: string[]): void {
    const page = this.document.pages[pageId];
    if (!page) return;
    const reordered: Record<string, AnimationConfig> = {};
    for (const id of orderedIds) {
      if (page.animations[id]) {
        reordered[id] = page.animations[id];
      }
    }
    for (const id of Object.keys(page.animations)) {
      if (!reordered[id]) {
        reordered[id] = page.animations[id];
      }
    }
    page.animations = reordered;
  }

  // ============================================================================
  // Internal Helpers
  // ============================================================================

  private findPageContainingElement(elementId: string): Page | undefined {
    for (const page of Object.values(this.document.pages)) {
      if (page.elements[elementId]) {
        return page;
      }
    }
    return undefined;
  }
}

function createEmptyDocument(): Document {
  const defaultPageId = 'page-default';
  const defaultPage: Page = {
    id: defaultPageId,
    name: 'Page 1',
    background: '#ffffff',
    elements: {},
    animations: {},
  };
  return {
    id: 'doc-default',
    name: 'Untitled',
    pages: {
      [defaultPageId]: defaultPage,
    },
    nodes: {},
    structureItems: [{ type: 'page', id: defaultPageId }],
    currentPageId: defaultPageId,
  };
}

export function createScene(document?: Document): Scene {
  return new Scene(document);
}
