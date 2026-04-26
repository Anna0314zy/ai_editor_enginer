import type { Guide } from '../types';

interface GuidesLayerProps {
  guides: Guide[];
}

function guideColor(kind: Guide['kind']): string {
  switch (kind) {
    case 'center':
      return '#10b981'; // green
    case 'spacing':
      return '#f59e0b'; // amber
    case 'edge':
    default:
      return '#3b82f6'; // blue
  }
}

export default function GuidesLayer({ guides }: GuidesLayerProps) {
  if (guides.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {guides.map((guide, index) =>
        guide.type === 'horizontal' ? (
          <div
            key={`h-${guide.kind}-${guide.position}-${index}`}
            style={{
              position: 'absolute',
              top: guide.position,
              left: 0,
              width: '100%',
              height: 1,
              backgroundColor: guideColor(guide.kind),
              opacity: 0.9,
            }}
          />
        ) : (
          <div
            key={`v-${guide.kind}-${guide.position}-${index}`}
            style={{
              position: 'absolute',
              left: guide.position,
              top: 0,
              width: 1,
              height: '100%',
              backgroundColor: guideColor(guide.kind),
              opacity: 0.9,
            }}
          />
        )
      )}
    </div>
  );
}
