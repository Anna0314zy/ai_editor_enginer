import { useState, useEffect } from 'react';
import type { Engine, EngineTopic } from '../engine';

export function useEngineSnapshot(engine: Engine): number {
  const [snapshot, setSnapshot] = useState(0);
  useEffect(() => {
    const cb = () => setSnapshot((v) => v + 1);
    engine.subscribe(cb);
    return () => engine.unsubscribe(cb);
  }, [engine]);
  return snapshot;
}

export function useEngineTopicSnapshot(engine: Engine, topic: EngineTopic): number {
  const [snapshot, setSnapshot] = useState(0);
  useEffect(() => {
    const cb = () => setSnapshot((v) => v + 1);
    engine.subscribe(topic, cb);
    return () => engine.unsubscribe(topic, cb);
  }, [engine, topic]);
  return snapshot;
}
