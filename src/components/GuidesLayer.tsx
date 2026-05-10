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
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-[100]"
    >
      {guides.map((guide, index) =>
        guide.type === 'horizontal' ? (
          <div
            key={`h-${guide.kind}-${guide.position}-${index}`}
            className="absolute left-0 w-full h-px opacity-90"
            style={{
              top: guide.position,
              backgroundColor: guideColor(guide.kind),
            }}
          />
        ) : (
          <div
            key={`v-${guide.kind}-${guide.position}-${index}`}
            className="absolute top-0 w-px h-full opacity-90"
            style={{
              left: guide.position,
              backgroundColor: guideColor(guide.kind),
            }}
          />
        )
      )}
    </div>
  );
}
