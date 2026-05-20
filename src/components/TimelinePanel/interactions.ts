import type { Timeline } from '../../engine/timeline/index';
import type { TimelineStore } from '../../store/timelineStore';
import type { Clip, Track } from '../../engine/timeline/types';
import { collectSnapPoints, findSnapPoint } from './snap';

// ============================================================================
// Timeline Interaction Layer
// Handles clip drag (move/cross-track), clip resize (trim), and clip split
// using native Pointer Events for sub-pixel precision and magnetic snapping.
// ============================================================================

export interface DragState {
  type: 'move' | 'trim-left' | 'trim-right';
  clipId: string;
  originalStartTime: number;
  originalDuration: number;
  originalTrackId: string;
  currentTrackId: string; // May differ from originalTrackId during cross-track drag
  startX: number; // initial pointer X (clientX)
  startY: number; // initial pointer Y (for cross-track detection)
  zoom: number;
  snapIndicatorTime: number | null;
}

export interface InteractionCallbacks {
  onDragStart?: (state: DragState) => void;
  onDragUpdate?: (state: DragState) => void;
  onDragEnd?: (state: DragState) => void;
}

/** Track layout info needed for cross-track hit testing */
export interface TrackLayout {
  trackId: string;
  top: number; // Y offset relative to tracks container
  height: number;
}

// ============================================================================
// startClipDrag - begins a clip move/trim interaction
// Supports cross-track dragging when trackLayouts are provided.
// ============================================================================

export function startClipDrag(
  e: PointerEvent,
  clip: Clip,
  dragType: 'move' | 'trim-left' | 'trim-right',
  timeline: Timeline,
  timelineStore: TimelineStore,
  callbacks?: InteractionCallbacks,
  trackLayouts?: TrackLayout[],
): void {
  e.preventDefault();
  e.stopPropagation();

  const zoom = timelineStore.getSnapshot().zoom;

  const state: DragState = {
    type: dragType,
    clipId: clip.id,
    originalStartTime: clip.startTime,
    originalDuration: clip.duration,
    originalTrackId: clip.trackId,
    currentTrackId: clip.trackId,
    startX: e.clientX,
    startY: e.clientY,
    zoom,
    snapIndicatorTime: null,
  };

  callbacks?.onDragStart?.(state);

  const onMove = (ev: PointerEvent) => {
    const deltaX = ev.clientX - state.startX;
    const deltaMs = deltaX / state.zoom;
    const currentSnap = timelineStore.getSnapshot();

    // Collect all clips for snapping (across all tracks)
    const allClips = currentSnap.project.tracks.flatMap((t) => t.clips);
    const snapPoints = collectSnapPoints(
      allClips,
      currentSnap.currentTime,
      currentSnap.duration,
      clip.id,
    );

    if (state.type === 'move') {
      const rawNewStart = Math.max(0, state.originalStartTime + deltaMs);
      const snapResult = findSnapPoint(rawNewStart, snapPoints, state.zoom);
      const newStart = snapResult.time;
      state.snapIndicatorTime = snapResult.indicatorTime;

      // Cross-track detection
      let targetTrackId = state.originalTrackId;
      if (trackLayouts && trackLayouts.length > 0) {
        const deltaY = ev.clientY - state.startY;
        targetTrackId = hitTestTrack(trackLayouts, state.originalTrackId, deltaY);
      }
      state.currentTrackId = targetTrackId;

      timeline.moveClip(clip.id, targetTrackId, newStart);
    } else if (state.type === 'trim-left') {
      const rawNewStart = Math.max(0, state.originalStartTime + deltaMs);
      const maxShrink = state.originalStartTime + state.originalDuration - 100; // min 100ms
      const clampedStart = Math.min(rawNewStart, maxShrink);
      const snapResult = findSnapPoint(clampedStart, snapPoints, state.zoom);
      const newStart = snapResult.time;
      state.snapIndicatorTime = snapResult.indicatorTime;

      const newDuration = state.originalStartTime + state.originalDuration - newStart;
      timeline.resizeClip(clip.id, newStart, newDuration);
    } else if (state.type === 'trim-right') {
      const rawNewEnd = Math.max(
        state.originalStartTime + 100, // min 100ms
        state.originalStartTime + state.originalDuration + deltaMs,
      );
      const snapResult = findSnapPoint(rawNewEnd, snapPoints, state.zoom);
      const snappedEnd = snapResult.time;
      state.snapIndicatorTime = snapResult.indicatorTime;

      const newDuration = snappedEnd - state.originalStartTime;
      timeline.resizeClip(clip.id, state.originalStartTime, Math.max(100, newDuration));
    }

    callbacks?.onDragUpdate?.(state);
  };

  const onUp = () => {
    state.snapIndicatorTime = null;
    callbacks?.onDragEnd?.(state);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
  };

  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

// ============================================================================
// hitTestTrack - determine which track the pointer is over given Y delta
// ============================================================================

function hitTestTrack(layouts: TrackLayout[], originalTrackId: string, deltaY: number): string {
  const origIndex = layouts.findIndex((l) => l.trackId === originalTrackId);
  if (origIndex < 0) return originalTrackId;

  const origLayout = layouts[origIndex];
  const origCenter = origLayout.top + origLayout.height / 2;
  const pointerY = origCenter + deltaY;

  // Find which track the pointer is over
  for (const layout of layouts) {
    if (pointerY >= layout.top && pointerY < layout.top + layout.height) {
      return layout.trackId;
    }
  }

  // If above all tracks, return first; if below, return last
  if (pointerY < layouts[0].top) return layouts[0].trackId;
  return layouts[layouts.length - 1].trackId;
}

// ============================================================================
// splitClipAtPlayhead - splits the selected clip at the current playhead position
// ============================================================================

export function splitClipAtPlayhead(
  clipId: string,
  timeline: Timeline,
  timelineStore: TimelineStore,
): boolean {
  const currentTime = timelineStore.getSnapshot().currentTime;
  const result = timeline.splitClip(clipId, currentTime);
  if (result) {
    // Select the second half
    timelineStore.selectClip(result[1].id);
    return true;
  }
  return false;
}

// ============================================================================
// setupSplitKeyboardShortcut - sets up S key for split
// Returns cleanup function.
// ============================================================================

export function setupSplitKeyboardShortcut(
  getSelectedClipId: () => string | null,
  timeline: Timeline,
  timelineStore: TimelineStore,
): () => void {
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 's' || e.key === 'S') {
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isEditing) return;

      const selectedId = getSelectedClipId();
      if (selectedId) {
        e.preventDefault();
        splitClipAtPlayhead(selectedId, timeline, timelineStore);
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}

// ============================================================================
// setupTimelineKeyboardShortcuts - comprehensive keyboard shortcuts
// Delete/Backspace: delete selected clip
// Ctrl+Z / Cmd+Z: undo
// Ctrl+Y / Cmd+Shift+Z: redo
// Space: toggle play/pause
// Ctrl+D / Cmd+D: duplicate selected clip
// Returns cleanup function.
// ============================================================================

export interface KeyboardShortcutDeps {
  getSelectedClipId: () => string | null;
  timeline: Timeline;
  timelineStore: TimelineStore;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function setupTimelineKeyboardShortcuts(deps: KeyboardShortcutDeps): () => void {
  const { getSelectedClipId, timeline, timelineStore, onUndo, onRedo } = deps;

  const handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement;
    const isEditing =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (isEditing) return;

    const isMod = e.ctrlKey || e.metaKey;

    // Space: toggle play/pause
    if (e.key === ' ') {
      e.preventDefault();
      timelineStore.togglePlay();
      return;
    }

    // Delete / Backspace: delete selected clip
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedId = getSelectedClipId();
      if (selectedId) {
        e.preventDefault();
        timeline.removeClip(selectedId);
        timelineStore.selectClip(null);
      }
      return;
    }

    // Ctrl+Z / Cmd+Z: undo
    if (isMod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      onUndo?.();
      return;
    }

    // Ctrl+Y / Cmd+Shift+Z: redo
    if ((isMod && e.key === 'y') || (isMod && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      onRedo?.();
      return;
    }

    // Ctrl+D / Cmd+D: duplicate selected clip
    if (isMod && (e.key === 'd' || e.key === 'D')) {
      const selectedId = getSelectedClipId();
      if (selectedId) {
        e.preventDefault();
        const clip = timeline.getClip(selectedId);
        if (clip) {
          const newClip = {
            ...clip,
            id: `${clip.id}-dup-${Date.now()}`,
            startTime: clip.endTime,
            endTime: clip.endTime + clip.duration,
          };
          timeline.addClip(clip.trackId, newClip);
          timelineStore.selectClip(newClip.id);
        }
      }
      return;
    }

    // S: split at playhead
    if (e.key === 's' || e.key === 'S') {
      if (!isMod) {
        const selectedId = getSelectedClipId();
        if (selectedId) {
          e.preventDefault();
          splitClipAtPlayhead(selectedId, timeline, timelineStore);
        }
      }
      return;
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}
