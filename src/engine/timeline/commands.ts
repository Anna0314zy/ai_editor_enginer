import type { Command } from '../../types';
import type { Timeline } from './index';
import type { Track, Clip, BaseClip } from './types';
import { syncClipEndTime } from './types';

// ============================================================================
// Timeline Commands - Undo/Redo support for multi-track operations
// All mutations go through these commands to enable history management.
// ============================================================================

// ============================================================================
// Track Commands
// ============================================================================

export class AddTrackCommand implements Command {
  constructor(
    private timeline: Timeline,
    private track: Track,
  ) {}

  execute(): void {
    this.timeline.addTrack(this.track);
  }

  undo(): void {
    this.timeline.removeTrack(this.track.id);
  }
}

export class RemoveTrackCommand implements Command {
  private removedTrack: Track | undefined;

  constructor(
    private timeline: Timeline,
    private trackId: string,
  ) {
    this.removedTrack = this.timeline.getTrack(trackId);
    if (this.removedTrack) {
      // Deep clone to preserve clips for undo
      this.removedTrack = JSON.parse(JSON.stringify(this.removedTrack));
    }
  }

  execute(): void {
    this.timeline.removeTrack(this.trackId);
  }

  undo(): void {
    if (this.removedTrack) {
      this.timeline.addTrack(this.removedTrack);
      // Restore clips
      for (const clip of this.removedTrack.clips) {
        this.timeline.addClip(this.removedTrack.id, clip);
      }
    }
  }
}

export class ReorderTracksCommand implements Command {
  private beforeOrder: string[];

  constructor(
    private timeline: Timeline,
    private afterOrder: string[],
  ) {
    this.beforeOrder = this.timeline.getTracks().map((t) => t.id);
  }

  execute(): void {
    this.timeline.reorderTracks(this.afterOrder);
  }

  undo(): void {
    this.timeline.reorderTracks(this.beforeOrder);
  }
}

export class UpdateTrackCommand implements Command {
  private before: Partial<Omit<Track, 'id' | 'clips'>>;

  constructor(
    private timeline: Timeline,
    private trackId: string,
    private updates: Partial<Omit<Track, 'id' | 'clips'>>,
  ) {
    const track = this.timeline.getTrack(trackId);
    this.before = {};
    if (track) {
      for (const key of Object.keys(updates) as Array<keyof typeof updates>) {
        (this.before as Record<string, unknown>)[key] = (
          track as unknown as Record<string, unknown>
        )[key];
      }
    }
  }

  execute(): void {
    this.timeline.updateTrack(this.trackId, this.updates);
  }

  undo(): void {
    this.timeline.updateTrack(this.trackId, this.before);
  }
}

// ============================================================================
// Clip Commands
// ============================================================================

export class AddClipCommand implements Command {
  constructor(
    private timeline: Timeline,
    private trackId: string,
    private clip: Clip,
  ) {}

  execute(): void {
    this.timeline.addClip(this.trackId, this.clip);
  }

  undo(): void {
    this.timeline.removeClip(this.clip.id);
  }
}

export class RemoveClipCommand implements Command {
  private removedClip: Clip | undefined;
  private trackId: string;

  constructor(
    private timeline: Timeline,
    private clipId: string,
  ) {
    this.removedClip = this.timeline.getClip(clipId);
    this.trackId = this.removedClip?.trackId ?? '';
    if (this.removedClip) {
      this.removedClip = { ...this.removedClip };
    }
  }

  execute(): void {
    this.timeline.removeClip(this.clipId);
  }

  undo(): void {
    if (this.removedClip && this.trackId) {
      this.timeline.addClip(this.trackId, this.removedClip);
    }
  }
}

export class MoveClipCommand implements Command {
  private originalTrackId: string;
  private originalStartTime: number;

  constructor(
    private timeline: Timeline,
    private clipId: string,
    private newTrackId: string,
    private newStartTime: number,
  ) {
    const clip = this.timeline.getClip(clipId);
    this.originalTrackId = clip?.trackId ?? '';
    this.originalStartTime = clip?.startTime ?? 0;
  }

  execute(): void {
    this.timeline.moveClip(this.clipId, this.newTrackId, this.newStartTime);
  }

  undo(): void {
    this.timeline.moveClip(this.clipId, this.originalTrackId, this.originalStartTime);
  }
}

export class ResizeClipCommand implements Command {
  private originalStartTime: number;
  private originalDuration: number;

  constructor(
    private timeline: Timeline,
    private clipId: string,
    private newStartTime: number,
    private newDuration: number,
  ) {
    const clip = this.timeline.getClip(clipId);
    this.originalStartTime = clip?.startTime ?? 0;
    this.originalDuration = clip?.duration ?? 0;
  }

  execute(): void {
    this.timeline.resizeClip(this.clipId, this.newStartTime, this.newDuration);
  }

  undo(): void {
    this.timeline.resizeClip(this.clipId, this.originalStartTime, this.originalDuration);
  }
}

export class SplitClipCommand implements Command {
  private originalClip: Clip | undefined;
  private splitResult: [Clip, Clip] | null = null;
  private trackId: string;

  constructor(
    private timeline: Timeline,
    private clipId: string,
    private splitTime: number,
  ) {
    const clip = this.timeline.getClip(clipId);
    this.trackId = clip?.trackId ?? '';
    if (clip) {
      this.originalClip = { ...clip };
    }
  }

  execute(): void {
    this.splitResult = this.timeline.splitClip(this.clipId, this.splitTime);
  }

  undo(): void {
    if (!this.splitResult || !this.originalClip) return;
    // Remove both halves
    this.timeline.removeClip(this.splitResult[0].id);
    this.timeline.removeClip(this.splitResult[1].id);
    // Restore original
    this.timeline.addClip(this.trackId, this.originalClip);
  }
}

export class UpdateClipCommand implements Command {
  private before: Partial<BaseClip>;

  constructor(
    private timeline: Timeline,
    private clipId: string,
    private updates: Partial<BaseClip>,
  ) {
    const clip = this.timeline.getClip(clipId);
    this.before = {};
    if (clip) {
      for (const key of Object.keys(updates) as Array<keyof typeof updates>) {
        (this.before as Record<string, unknown>)[key] = (
          clip as unknown as Record<string, unknown>
        )[key];
      }
    }
  }

  execute(): void {
    this.timeline.updateClip(this.clipId, this.updates);
  }

  undo(): void {
    this.timeline.updateClip(this.clipId, this.before);
  }
}

// ============================================================================
// Composite Timeline Command - batch multiple operations as one undo step
// ============================================================================

export class CompositeTimelineCommand implements Command {
  constructor(private commands: Command[]) {}

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}
