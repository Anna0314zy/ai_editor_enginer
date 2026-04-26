import type { Guide, SnapResult } from '../types';

export interface Rect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapInput {
  currentRect: Rect;
  otherRects: Rect[];
  canvasSize: { width: number; height: number };
  threshold?: number;
}

interface SnapLine {
  position: number;
  sourceId: string;
}

function dedupSnapLines(lines: SnapLine[]): SnapLine[] {
  const seen = new Set<number>();
  const result: SnapLine[] = [];
  for (const line of lines) {
    if (!seen.has(line.position)) {
      seen.add(line.position);
      result.push(line);
    }
  }
  return result;
}

/**
 * Find the best edge/center alignment within threshold.
 * Returns null if no match.
 */
function findSnap(
  currentPositions: number[],
  lines: SnapLine[],
  threshold: number
): { offset: number; guides: SnapLine[] } | null {
  if (lines.length === 0) return null;

  let bestOffset = 0;
  let minDistance = Infinity;
  const matchedLines: SnapLine[] = [];

  for (const pos of currentPositions) {
    for (const line of lines) {
      const dist = Math.abs(pos - line.position);
      if (dist < threshold && dist < minDistance) {
        minDistance = dist;
        bestOffset = line.position - pos;
        matchedLines.length = 0;
        matchedLines.push(line);
      } else if (
        minDistance < Infinity &&
        Math.abs(dist - minDistance) < 0.001 &&
        Math.abs(line.position - pos - bestOffset) < 0.001
      ) {
        matchedLines.push(line);
      }
    }
  }

  if (minDistance === Infinity) return null;
  return { offset: bestOffset, guides: dedupSnapLines(matchedLines) };
}

/**
 * Find equal spacing (distribution or continuation) based on rect gaps.
 * Only checks adjacent rects (sorted by axis), O(n).
 * Returns null if no match.
 */
function findEqualSpacing(
  currentRect: Rect,
  otherRects: Rect[],
  threshold: number,
  axis: 'x' | 'y'
): { offset: number; guides: SnapLine[] } | null {
  if (otherRects.length < 2) return null;

  const posKey = axis === 'x' ? 'x' : 'y';
  const sizeKey = axis === 'x' ? 'width' : 'height';

  // Sort rects by position on the axis
  const sorted = [...otherRects].sort((a, b) => a[posKey] - b[posKey]);

  let bestOffset = 0;
  let minDistance = Infinity;
  const matchedLines: SnapLine[] = [];

  const currentPos = currentRect[posKey];
  const currentSize = currentRect[sizeKey];

  for (let i = 0; i < sorted.length - 1; i++) {
    const prev = sorted[i];
    const next = sorted[i + 1];

    const prevRight = prev[posKey] + prev[sizeKey];
    const nextLeft = next[posKey];
    const gap = nextLeft - prevRight;

    if (gap < 0) continue; // overlapping rects, skip

    // ── 1. Distribution: current sits between prev and next with equal gaps ──
    // current.left - prev.right = next.left - current.right
    // => current.x = (prev.right + next.left - current.width) / 2
    const expectedMid = (prevRight + nextLeft - currentSize) / 2;
    const distMid = Math.abs(currentPos - expectedMid);
    if (distMid < threshold && distMid < minDistance) {
      minDistance = distMid;
      bestOffset = expectedMid - currentPos;
      matchedLines.length = 0;
      matchedLines.push(
        { position: prevRight, sourceId: 'spacing' },
        { position: nextLeft, sourceId: 'spacing' }
      );
    }

    // ── 2. Continuation to the right: next.right + gap ──
    // current.left - next.right = gap
    // => current.x = next.right + gap
    const expectedRight = next[posKey] + next[sizeKey] + gap;
    const distRight = Math.abs(currentPos - expectedRight);
    if (distRight < threshold && distRight < minDistance) {
      minDistance = distRight;
      bestOffset = expectedRight - currentPos;
      matchedLines.length = 0;
      matchedLines.push(
        { position: prevRight, sourceId: 'spacing' },
        { position: nextLeft, sourceId: 'spacing' }
      );
    }

    // ── 3. Continuation to the left: prev.left - gap - current.width ──
    // prev.left - current.right = gap
    // => current.x = prev.left - gap - current.width
    const expectedLeft = prev[posKey] - gap - currentSize;
    const distLeft = Math.abs(currentPos - expectedLeft);
    if (distLeft < threshold && distLeft < minDistance) {
      minDistance = distLeft;
      bestOffset = expectedLeft - currentPos;
      matchedLines.length = 0;
      matchedLines.push(
        { position: prevRight, sourceId: 'spacing' },
        { position: nextLeft, sourceId: 'spacing' }
      );
    }
  }

  if (minDistance === Infinity) return null;
  return { offset: bestOffset, guides: dedupSnapLines(matchedLines) };
}

function solveAxis(
  currentRect: Rect,
  otherRects: Rect[],
  canvasSize: number,
  threshold: number,
  axis: 'x' | 'y'
): { offset: number; guides: Guide[] } {
  const posKey = axis === 'x' ? 'x' : 'y';
  const sizeKey = axis === 'x' ? 'width' : 'height';

  const currentEdges = [
    currentRect[posKey],
    currentRect[posKey] + currentRect[sizeKey],
  ];
  const currentCenter = currentRect[posKey] + currentRect[sizeKey] / 2;

  // ── Build reference lines by priority ──
  const centerLines: SnapLine[] = [];
  const edgeLines: SnapLine[] = [];

  for (const r of otherRects) {
    if (r.id === currentRect.id) continue; // safety: skip self
    centerLines.push({ position: r[posKey] + r[sizeKey] / 2, sourceId: r.id });
    edgeLines.push(
      { position: r[posKey], sourceId: r.id },
      { position: r[posKey] + r[sizeKey], sourceId: r.id }
    );
  }

  // Canvas references
  centerLines.push({ position: canvasSize / 2, sourceId: 'canvas' });
  edgeLines.push(
    { position: 0, sourceId: 'canvas' },
    { position: canvasSize, sourceId: 'canvas' }
  );

  // ── Priority 1: center alignment ──
  const centerSnap = findSnap([currentCenter], centerLines, threshold);
  if (centerSnap) {
    return {
      offset: centerSnap.offset,
      guides: centerSnap.guides.map((g) => ({
        type: axis === 'x' ? 'vertical' : 'horizontal',
        kind: 'center' as const,
        position: g.position,
        sourceId: g.sourceId,
      })),
    };
  }

  // ── Priority 2: edge alignment ──
  const edgeSnap = findSnap(currentEdges, edgeLines, threshold);
  if (edgeSnap) {
    return {
      offset: edgeSnap.offset,
      guides: edgeSnap.guides.map((g) => ({
        type: axis === 'x' ? 'vertical' : 'horizontal',
        kind: 'edge' as const,
        position: g.position,
        sourceId: g.sourceId,
      })),
    };
  }

  // ── Priority 3: equal spacing ──
  const spacingSnap = findEqualSpacing(currentRect, otherRects, threshold, axis);
  if (spacingSnap) {
    // Limit to max 2 guides
    const limitedGuides = spacingSnap.guides.slice(0, 2);
    return {
      offset: spacingSnap.offset,
      guides: limitedGuides.map((g) => ({
        type: axis === 'x' ? 'vertical' : 'horizontal',
        kind: 'spacing' as const,
        position: g.position,
        sourceId: g.sourceId,
      })),
    };
  }

  // No match
  return { offset: 0, guides: [] };
}

export function snapEngine(input: SnapInput): SnapResult {
  const { currentRect, otherRects, canvasSize, threshold = 5 } = input;

  // Filter out current rect to avoid self-snapping
  const filteredOthers = otherRects.filter((r) => r.id !== currentRect.id);

  const xResult = solveAxis(currentRect, filteredOthers, canvasSize.width, threshold, 'x');
  const yResult = solveAxis(currentRect, filteredOthers, canvasSize.height, threshold, 'y');

  const guides: Guide[] = [...xResult.guides, ...yResult.guides];

  return {
    x: currentRect.x + xResult.offset,
    y: currentRect.y + yResult.offset,
    guides,
  };
}
