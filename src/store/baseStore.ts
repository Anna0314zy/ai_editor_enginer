import type { Engine, EngineTopic } from '../engine';

/**
 * Generic pub/sub base for all stores.
 */
export abstract class BaseStore<TSnapshot> {
  protected listeners = new Set<() => void>();
  private cachedSnapshot: TSnapshot | undefined;
  private cacheValid = false;

  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  protected emit(): void {
    this.cacheValid = false;
    for (const cb of this.listeners) {
      cb();
    }
  }

  getSnapshot = (): TSnapshot => {
    if (!this.cacheValid) {
      this.cachedSnapshot = this.buildSnapshot();
      this.cacheValid = true;
    }
    return this.cachedSnapshot!;
  };

  protected abstract buildSnapshot(): TSnapshot;
}

/**
 * Base store that auto-subscribes to one or more Engine topics.
 */
export abstract class EngineStore<TSnapshot> extends BaseStore<TSnapshot> {
  constructor(
    protected engine: Engine,
    topics: EngineTopic[]
  ) {
    super();
    const handler = (): void => this.emit();
    for (const topic of topics) {
      this.engine.subscribe(topic, handler);
    }
  }
}
