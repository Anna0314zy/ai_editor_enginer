import type { MediaResource } from '../engine/timeline/types';

// ============================================================================
// Media Resource Manager
// Unified management of video/audio/image resources.
// Clips reference resources via resourceId, not direct src.
// ============================================================================

export class ResourceManager {
  private resources = new Map<string, MediaResource>();
  private preloadCache = new Map<string, HTMLMediaElement>();

  // --- CRUD ---

  add(resource: MediaResource): void {
    this.resources.set(resource.id, resource);
  }

  remove(id: string): void {
    this.resources.delete(id);
    // Clean up preload cache
    const cached = this.preloadCache.get(id);
    if (cached) {
      cached.src = '';
      this.preloadCache.delete(id);
    }
  }

  get(id: string): MediaResource | undefined {
    return this.resources.get(id);
  }

  getAll(): MediaResource[] {
    return Array.from(this.resources.values());
  }

  has(id: string): boolean {
    return this.resources.has(id);
  }

  clear(): void {
    for (const [id] of this.preloadCache) {
      const el = this.preloadCache.get(id);
      if (el) el.src = '';
    }
    this.preloadCache.clear();
    this.resources.clear();
  }

  // --- Preload ---

  /**
   * Preload a media resource into browser cache.
   * For video/audio: creates a hidden element and starts loading.
   */
  async preload(id: string): Promise<void> {
    const resource = this.resources.get(id);
    if (!resource) return;

    if (this.preloadCache.has(id)) return; // Already preloaded

    if (resource.type === 'video' || resource.type === 'audio') {
      const el = document.createElement(resource.type);
      el.preload = 'auto';
      el.src = resource.src;

      this.preloadCache.set(id, el);

      return new Promise<void>((resolve, reject) => {
        el.addEventListener('canplaythrough', () => resolve(), { once: true });
        el.addEventListener('error', () => reject(new Error(`Failed to preload ${resource.src}`)), {
          once: true,
        });
        el.load();
      });
    }

    if (resource.type === 'image') {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image ${resource.src}`));
        img.src = resource.src;
      });
    }
  }

  /**
   * Get the src URL for a given resource ID.
   */
  getSrc(id: string): string | undefined {
    return this.resources.get(id)?.src;
  }

  /**
   * Get the duration of a media resource (if known).
   */
  getDuration(id: string): number | undefined {
    return this.resources.get(id)?.duration;
  }

  /**
   * Update resource metadata (e.g., after loading duration from media element).
   */
  updateMetadata(id: string, updates: Partial<MediaResource>): void {
    const resource = this.resources.get(id);
    if (resource) {
      Object.assign(resource, updates);
    }
  }
}
