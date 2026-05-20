import type { Clip } from '../../engine/timeline/types';

// ============================================================================
// Snap System - Magnetic alignment for clips during drag/resize
// ============================================================================

export interface SnapPoint {
  time: number;
  type: 'clip-start' | 'clip-end' | 'playhead' | 'second';
  clipId?: string;
}

export interface SnapResult {
  snapped: boolean;
  time: number;
  snapPoint: SnapPoint | null;
  /** Snap indicator line position in ms */
  indicatorTime: number | null;
}

const SNAP_THRESHOLD_PX = 8;

/**
 * Collect all available snap points from clips, playhead, and integer seconds.
 */
export function collectSnapPoints(
  clips: Clip[],
  currentTime: number,
  duration: number,
  excludeClipId?: string,
): SnapPoint[] {
  const points: SnapPoint[] = [];

  // Playhead
  points.push({ time: currentTime, type: 'playhead' });

  // Clip start/end points
  for (const clip of clips) {
    if (clip.id === excludeClipId) continue;
    points.push({ time: clip.startTime, type: 'clip-start', clipId: clip.id });
    points.push({ time: clip.endTime, type: 'clip-end', clipId: clip.id });
  }

  // Integer seconds within visible range
  for (let s = 0; s <= Math.ceil(duration / 1000); s++) {
    points.push({ time: s * 1000, type: 'second' });
  }

  return points;
}

/**
 * Find the nearest snap point to the given time.
 * Returns snapped time if within threshold, otherwise returns the original time.
 */
export function findSnapPoint(
  time: number,
  snapPoints: SnapPoint[],
  zoom: number,
  snapThresholdPx: number = SNAP_THRESHOLD_PX,
): SnapResult {
  const thresholdMs = snapThresholdPx / zoom;
  let nearest: SnapPoint | null = null;
  let minDist = Infinity;

  for (const point of snapPoints) {
    const dist = Math.abs(point.time - time);
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  }

  if (nearest && minDist <= thresholdMs) {
    return {
      snapped: true,
      time: nearest.time,
      snapPoint: nearest,
      indicatorTime: nearest.time,
    };
  }

  return {
    snapped: false,
    time,
    snapPoint: null,
    indicatorTime: null,
  };
}
