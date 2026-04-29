import { useState, useEffect } from 'react';
import type { Engine } from '../engine';

export function useEngineSnapshot(engine: Engine): number {
  const [snapshot, setSnapshot] = useState(0);
  useEffect(() => {
    const cb = () => setSnapshot((v) => v + 1);
    engine.subscribe(cb);
    return () => engine.unsubscribe(cb);
  }, [engine]);
  return snapshot;
}
