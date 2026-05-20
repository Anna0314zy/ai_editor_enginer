import { useCallback, useRef } from 'react';

// ============================================================================
// TimeRuler - Time scale at the top of the timeline
// ============================================================================

interface TimeRulerProps {
  zoom: number; // px/ms
  scrollLeft: number; // ms
  duration: number; // ms
  height: number; // px
  onSeek: (time: number) => void;
}

export default function TimeRuler({ zoom, scrollLeft, duration, height, onSeek }: TimeRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);

  // Calculate tick interval based on zoom level
  const getTickInterval = (): { major: number; minor: number } => {
    const pxPerSecond = zoom * 1000;
    if (pxPerSecond >= 200) return { major: 1000, minor: 100 }; // 1s major, 100ms minor
    if (pxPerSecond >= 100) return { major: 2000, minor: 500 }; // 2s major, 500ms minor
    if (pxPerSecond >= 50) return { major: 5000, minor: 1000 }; // 5s major, 1s minor
    if (pxPerSecond >= 20) return { major: 10000, minor: 2000 }; // 10s major, 2s minor
    return { major: 30000, minor: 5000 }; // 30s major, 5s minor
  };

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = rulerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickX = e.clientX - rect.left;
      const time = scrollLeft + clickX / zoom;
      onSeek(Math.max(0, Math.min(time, duration)));
    },
    [scrollLeft, zoom, duration, onSeek],
  );

  const { major, minor } = getTickInterval();
  const totalWidth = duration * zoom;

  // Generate ticks
  const ticks: { time: number; isMajor: boolean }[] = [];
  const startTime = Math.floor(scrollLeft / minor) * minor;
  const endTime = duration + minor;

  for (let t = startTime; t <= endTime; t += minor) {
    if (t < 0) continue;
    ticks.push({ time: t, isMajor: t % major === 0 });
  }

  const formatTickLabel = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (minutes > 0) return `${minutes}:${String(seconds).padStart(2, '0')}`;
    return `${seconds}s`;
  };

  return (
    <div
      ref={rulerRef}
      className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 cursor-pointer"
      style={{ height, width: totalWidth }}
      onClick={handleClick}
    >
      {ticks.map((tick) => {
        const x = (tick.time - scrollLeft) * zoom;
        if (x < -50 || x > totalWidth + 50) return null;
        return (
          <div
            key={tick.time}
            className="absolute top-0"
            style={{ left: tick.time * zoom, height: '100%' }}
          >
            <div
              className={`absolute bottom-0 ${tick.isMajor ? 'bg-gray-500' : 'bg-gray-600'}`}
              style={{
                width: 1,
                height: tick.isMajor ? '60%' : '30%',
              }}
            />
            {tick.isMajor && (
              <span
                className="absolute text-[10px] text-gray-400 top-0.5 whitespace-nowrap"
                style={{ left: 3 }}
              >
                {formatTickLabel(tick.time)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
