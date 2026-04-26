// Engine core - framework agnostic
// All state changes MUST go through engine.execute(command)

export { Scene, createScene } from './scene';
export { History } from './history';
export { Timeline } from './timeline';
export { Engine, createEngine } from './engine';
export { AddElementCommand, MoveElementCommand, DeleteElementCommand, AddAnimationCommand, RemoveAnimationCommand, UpdateAnimationCommand, ReorderAnimationsCommand } from './commands';
export { BatchAnimationCommand } from './animationCommands';
export { snapEngine } from './snapEngine';
export type { Rect as SnapRect, SnapInput } from './snapEngine';
