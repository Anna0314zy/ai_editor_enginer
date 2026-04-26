import type { AnimationConfig, ClickStep, AnimationBatch } from '../types/animation';
import type { AnimationEngine } from './engine';

/**
 * Build ClickSteps from animations array.
 * click = new Step
 * withPrev = join current Batch
 * afterPrev = new Batch in current Step
 */
export function buildClickSteps(animations: AnimationConfig[]): ClickStep[] {
  const steps: ClickStep[] = [];
  let currentStep: ClickStep | null = null;
  let currentBatch: AnimationBatch | null = null;

  for (const anim of animations) {
    if (anim.startType === 'click') {
      currentBatch = { id: `batch-0`, animations: [anim] };
      currentStep = { id: `step-${steps.length}`, batches: [currentBatch] };
      steps.push(currentStep);
    } else if (anim.startType === 'withPrev') {
      if (currentBatch) {
        currentBatch.animations.push(anim);
      }
    } else if (anim.startType === 'afterPrev') {
      if (currentStep) {
        currentBatch = {
          id: `batch-${currentStep.batches.length}`,
          animations: [anim],
        };
        currentStep.batches.push(currentBatch);
      }
    }
  }

  return steps;
}

/**
 * AnimationScheduler implements the Batch Execution Model.
 * Steps execute on user click. Within a Step, Batches execute sequentially.
 * Within a Batch, all animations execute concurrently.
 */
export class AnimationScheduler {
  private animationEngine: AnimationEngine;
  private steps: ClickStep[] = [];
  private currentStepIndex = -1;
  private runningControllers = new Map<string, ReturnType<AnimationEngine['play']>>();

  constructor(animationEngine: AnimationEngine) {
    this.animationEngine = animationEngine;
  }

  load(animations: AnimationConfig[]): void {
    this.steps = buildClickSteps(animations);
    this.currentStepIndex = -1;
    this.runningControllers.clear();
  }

  playNextStep(): boolean {
    if (this.currentStepIndex + 1 >= this.steps.length) return false;
    this.currentStepIndex++;
    this.executeStep(this.steps[this.currentStepIndex]);
    return true;
  }

  private executeStep(step: ClickStep): void {
    this.executeBatch(step, 0);
  }

  private executeBatch(step: ClickStep, batchIndex: number): void {
    const batch = step.batches[batchIndex];
    if (!batch) return;

    const unfinished = new Set(batch.animations.map((a) => a.id));

    for (const anim of batch.animations) {
      const controller = this.animationEngine.play(anim.id);
      if (controller) {
        this.runningControllers.set(anim.id, controller);
        controller.onFinish(() => {
          this.runningControllers.delete(anim.id);
          unfinished.delete(anim.id);
          if (unfinished.size === 0) {
            this.executeBatch(step, batchIndex + 1);
          }
        });
      } else {
        unfinished.delete(anim.id);
      }
    }

    if (unfinished.size === 0) {
      this.executeBatch(step, batchIndex + 1);
    }
  }

  playFromStep(stepIndex: number): void {
    this.currentStepIndex = stepIndex - 1;
    this.playNextStep();
  }

  reset(): void {
    for (const controller of this.runningControllers.values()) {
      if (controller) controller.cancel();
    }
    this.runningControllers.clear();
    this.currentStepIndex = -1;
    this.steps = [];
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  getStepCount(): number {
    return this.steps.length;
  }

  canAdvance(): boolean {
    return this.currentStepIndex + 1 < this.steps.length;
  }
}
