import { BaseStore } from './baseStore';

export interface PluginLifecycle {
  onInit?(): void;
  onDestroy?(): void;
  onPageChange?(pageId: string): void;
  onElementSelect?(elementIds: string[]): void;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  config: Record<string, unknown>;
  lifecycle?: PluginLifecycle;
}

export interface PluginSnapshot {
  plugins: Plugin[];
  enabledPlugins: Plugin[];
}

export class PluginStore extends BaseStore<PluginSnapshot> {
  private plugins = new Map<string, Plugin>();

  protected buildSnapshot(): PluginSnapshot {
    const all = Array.from(this.plugins.values());
    return {
      plugins: all,
      enabledPlugins: all.filter((p) => p.enabled),
    };
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered.`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    if (plugin.enabled && plugin.lifecycle?.onInit) {
      plugin.lifecycle.onInit();
    }
    this.emit();
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin?.lifecycle?.onDestroy) {
      plugin.lifecycle.onDestroy();
    }
    this.plugins.delete(pluginId);
    this.emit();
  }

  enable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || plugin.enabled) return;
    plugin.enabled = true;
    if (plugin.lifecycle?.onInit) {
      plugin.lifecycle.onInit();
    }
    this.emit();
  }

  disable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) return;
    plugin.enabled = false;
    if (plugin.lifecycle?.onDestroy) {
      plugin.lifecycle.onDestroy();
    }
    this.emit();
  }

  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  setConfig(pluginId: string, config: Record<string, unknown>): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    plugin.config = { ...plugin.config, ...config };
    this.emit();
  }

  callLifecycle<K extends keyof PluginLifecycle>(
    event: K,
    ...args: PluginLifecycle[K] extends (...args: infer P) => void ? P : never[]
  ): void {
    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled) continue;
      const handler = plugin.lifecycle?.[event];
      if (handler) {
        (handler as (...args: unknown[]) => void)(...args);
      }
    }
  }
}
