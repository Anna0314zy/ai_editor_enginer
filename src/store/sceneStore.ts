import { EngineStore } from './baseStore';
import type { Document, Element, Node, Page, StructureItem, AnimationConfig } from '../types';
import type { Engine } from '../engine';

export interface SceneSnapshot {
  document: Document;
  currentPageId: string;
  currentPage: Page | undefined;
  currentPageElements: Element[];
  structureItems: StructureItem[];
  pages: Page[];
  nodes: Node[];
}

export class SceneStore extends EngineStore<SceneSnapshot> {
  constructor(engine: Engine) {
    super(engine, ['scene']);
  }

  protected buildSnapshot(): SceneSnapshot {
    const document = this.engine.scene.getDocument();
    const currentPageId = document.currentPageId;
    const currentPage = this.engine.scene.getPage(currentPageId);
    return {
      document,
      currentPageId,
      currentPage,
      currentPageElements: this.engine.scene.getPageElements(currentPageId),
      structureItems: document.structureItems,
      pages: Object.values(document.pages),
      nodes: Object.values(document.nodes),
    };
  }

  getElement(id: string): Element | undefined {
    return this.engine.scene.getElement(id);
  }

  getPage(pageId: string): Page | undefined {
    return this.engine.scene.getPage(pageId);
  }

  getPageElements(pageId: string): Element[] {
    return this.engine.scene.getPageElements(pageId);
  }

  getPageAnimations(pageId: string): AnimationConfig[] {
    return this.engine.scene.getPageAnimations(pageId);
  }

  getAnimation(id: string): AnimationConfig | undefined {
    return this.engine.scene.getAnimation(id);
  }

  getNode(nodeId: string): Node | undefined {
    return this.engine.scene.getNode(nodeId);
  }
}
