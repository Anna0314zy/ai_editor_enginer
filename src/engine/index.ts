// Engine core - framework agnostic
// All state changes MUST go through engine.execute(command)

export { Scene, createScene } from './scene';
export { History } from './history';
export { Timeline } from './timeline/index';
export { RenderScheduler } from './renderScheduler';
export type { FrameInfo, RenderCallback, RenderSchedulerOptions } from './renderScheduler';
export { Engine, createEngine } from './engine';
export type { EngineTopic, SelectorFn, ComparatorFn } from './engine';
export {
  AddElementCommand,
  MoveElementCommand,
  DeleteElementCommand,
  BatchMoveCommand,
  CompositeCommand,
  AddAnimationCommand,
  RemoveAnimationCommand,
  UpdateAnimationCommand,
  ReorderAnimationsCommand,
  AddPageCommand,
  RemovePageCommand,
  UpdatePageCommand,
  SetPageKindCommand,
  UpdatePageVideoCommand,
  UpdateDocumentBackgroundCommand,
  UpdateDocumentSafeAreaCommand,
  AddNodeCommand,
  RemoveNodeCommand,
  ReorderStructureItemsCommand,
} from './commands';

// Timeline Commands
export {
  AddTrackCommand,
  RemoveTrackCommand,
  ReorderTracksCommand,
  UpdateTrackCommand,
  AddClipCommand,
  RemoveClipCommand,
  MoveClipCommand,
  ResizeClipCommand,
  SplitClipCommand,
  UpdateClipCommand,
  CompositeTimelineCommand,
} from './timeline/commands';

export { BatchAnimationCommand } from './animationCommands';
export { snapEngine } from './snapEngine';
export type { Rect as SnapRect, SnapInput } from './snapEngine';
export { PluginRegistry } from './pluginRegistry';
export type { EnginePlugin, PanelDescriptor } from './pluginRegistry';
