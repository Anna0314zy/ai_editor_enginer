import type { ComponentType, ReactNode, MouseEvent } from 'react';
import type { Engine } from './engine';
import type { Element } from '../types';

export interface PanelDescriptor {
  id: string;
  label: string;
  component: ComponentType<{ engine: Engine; animationEngine: unknown }>;
}

export interface ComponentRenderProps {
  onClick?: (id: string) => void;
  onMouseDown?: (e: MouseEvent, id: string) => void;
  isSelected?: boolean;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
}

export interface ComponentDescriptor {
  type: string;
  label: string;
  icon: ReactNode;
  createDefaultElement(x: number, y: number): Element;
  render(element: Element, props: ComponentRenderProps): ReactNode;
  renderThumbnail(element: Element): ReactNode;
}

export interface EnginePlugin {
  id: string;
  name: string;
  version?: string;
  enabled?: boolean;
  panel?: PanelDescriptor;
  components?: ComponentDescriptor[];
  onRegister?(engine: Engine): void;
  onUnregister?(engine: Engine): void;
}

export class PluginRegistry {
  private plugins = new Map<string, EnginePlugin>();
  private components = new Map<string, ComponentDescriptor>();

  register(plugin: EnginePlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    if (plugin.components) {
      for (const descriptor of plugin.components) {
        this.components.set(descriptor.type, descriptor);
      }
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin?.components) {
      for (const descriptor of plugin.components) {
        this.components.delete(descriptor.type);
      }
    }
    this.plugins.delete(pluginId);
  }

  getPlugins(): EnginePlugin[] {
    return Array.from(this.plugins.values());
  }

  getPanels(): PanelDescriptor[] {
    return this.getPlugins()
      .filter((p) => p.enabled !== false && p.panel)
      .map((p) => p.panel!);
  }

  getPlugin(id: string): EnginePlugin | undefined {
    return this.plugins.get(id);
  }

  registerComponent(descriptor: ComponentDescriptor): void {
    this.components.set(descriptor.type, descriptor);
  }

  unregisterComponent(type: string): void {
    this.components.delete(type);
  }

  getComponent(type: string): ComponentDescriptor | undefined {
    return this.components.get(type);
  }

  getComponents(): ComponentDescriptor[] {
    return Array.from(this.components.values());
  }
}
