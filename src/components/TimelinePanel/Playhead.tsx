import { useCallback, useRef } from 'react';

// ============================================================================
// Playhead - Red vertical line that follows currentTime, draggable for seeking
// ============================================================================

interface PlayheadProps {
  currentTime: number; // ms
  zoom: number; // px/ms
  scrollLeft: number; // ms
  height: number; // px (total height including ruler)
  onSeek: (time: number) => void;
}

export default function Playhead({ currentTime, zoom, scrollLeft, height, onSeek }: PlayheadProps) {
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const positionPx = (currentTime - scrollLeft) * zoom;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      draggingRef.current = true;

      const startX = e.clientX;
      const startTime = currentTime;

      const onMove = (ev: PointerEvent) => {
        if (!draggingRef.current) return;
        const deltaX = ev.clientX - startX;
        const deltaTime = deltaX / zoom;
        const newTime = Math.max(0, startTime + deltaTime);
        onSeek(newTime);
      };

      const onUp = () => {
        draggingRef.current = false;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [currentTime, zoom, onSeek],
  );

  // Don't render if off screen
  if (positionPx < -10) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-0 pointer-events-none"
      style={{ left: currentTime * zoom, height, zIndex: 50 }}
    >
      {/* Triangle handle at top */}
      <div
        className="pointer-events-auto cursor-col-resize"
        style={{
          position: 'absolute',
          top: 0,
          left: -6,
          width: 12,
          height: 12,
        }}
        onPointerDown={handlePointerDown}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="0,0 12,0 6,10" fill="#ef4444" />
        </svg>
      </div>

      {/* Vertical line */}
      <div
        className="absolute top-0 bg-red-500"
        style={{
          left: 0,
          width: 1.5,
          height: '100%',
          transform: 'translateX(-0.75px)',
        }}
      />
    </div>
  );
}
