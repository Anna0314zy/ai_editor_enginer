import type { Command } from '../types';
import type { AnimationConfig } from '../types/animation';
import type { AnimationEngine } from '../animation';

function cloneConfigs(configs: AnimationConfig[]): AnimationConfig[] {
  return configs.map((c) => ({ ...c }));
}

/**
 * BatchAnimationCommand captures a before/after snapshot of all animation configs.
 * Each user gesture in the animation panel (add, remove, reorder) produces exactly
 * one Command, preventing Command explosion from internal register/unregister calls.
 */
export class BatchAnimationCommand implements Command {
  private before: AnimationConfig[];
  private after: AnimationConfig[];

  constructor(
    private animationEngine: AnimationEngine,
    before: AnimationConfig[],
    after: AnimationConfig[]
  ) {
    this.before = cloneConfigs(before);
    this.after = cloneConfigs(after);
  }

  execute(): void {
    this.apply(this.after);
  }

  undo(): void {
    this.apply(this.before);
  }

  private apply(list: AnimationConfig[]): void {
    for (const c of this.animationEngine.getAllConfigs()) {
      this.animationEngine.unregister(c.id);
    }
    for (const c of list) {
      this.animationEngine.register(c);
    }
  }
}
