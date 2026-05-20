import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import VideoEditorPage from './pages/VideoEditor/VideoEditorPage';
import { StoreProvider } from './store';
import { createEngine } from './engine';
import { AnimationEngine, WebAnimationAdapter } from './animation';
import { aiCoursewarePlugin } from './plugins/aiCourseware';
// import { videoPlugin } from './plugins/videoPlugin'
import { setPluginRegistry } from './renderer';
import type { Track, VideoClip, AudioClip, TextClip } from './engine/timeline/types';

const engine = createEngine();
engine.use(aiCoursewarePlugin);
// engine.use(videoPlugin);
setPluginRegistry(engine.pluginRegistry);
(window as any)._engine = engine;

// --- Demo data for Timeline multi-track panel ---
const demoTracks: Track[] = [
  {
    id: 'track-video-1',
    type: 'video',
    name: 'Video 1',
    order: 0,
    locked: false,
    visible: true,
    clips: [
      {
        id: 'clip-v1',
        trackId: 'track-video-1',
        type: 'video',
        name: 'Intro.mp4',
        startTime: 0,
        duration: 3000,
        endTime: 3000,
        inPoint: 0,
        volume: 1,
        speed: 1,
      } as VideoClip,
      {
        id: 'clip-v2',
        trackId: 'track-video-1',
        type: 'video',
        name: 'Main.mp4',
        startTime: 3000,
        duration: 5000,
        endTime: 8000,
        inPoint: 0,
        volume: 1,
        speed: 1,
      } as VideoClip,
    ],
  },
  {
    id: 'track-overlay-1',
    type: 'overlay',
    name: 'Text & Stickers',
    order: 1,
    locked: false,
    visible: true,
    clips: [
      {
        id: 'clip-t1',
        trackId: 'track-overlay-1',
        type: 'text',
        name: 'Title',
        startTime: 500,
        duration: 2500,
        endTime: 3000,
        inPoint: 0,
        content: 'Hello World',
        style: { fontSize: 32, fontFamily: 'sans-serif', color: '#fff', align: 'center' },
      } as TextClip,
      {
        id: 'clip-t2',
        trackId: 'track-overlay-1',
        type: 'text',
        name: 'Subtitle',
        startTime: 4000,
        duration: 3000,
        endTime: 7000,
        inPoint: 0,
        content: 'Welcome',
        style: { fontSize: 24, fontFamily: 'sans-serif', color: '#eee', align: 'center' },
      } as TextClip,
    ],
  },
  {
    id: 'track-audio-1',
    type: 'audio',
    name: 'Audio 1',
    order: 2,
    locked: false,
    visible: true,
    clips: [
      {
        id: 'clip-a1',
        trackId: 'track-audio-1',
        type: 'audio',
        name: 'BGM.mp3',
        startTime: 0,
        duration: 8000,
        endTime: 8000,
        inPoint: 0,
        volume: 0.8,
      } as AudioClip,
    ],
  },
];

for (const track of demoTracks) {
  engine.timeline.addTrack(track);
}
// --- End demo data ---

const animationEngine = new AnimationEngine(new WebAnimationAdapter());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider engine={engine}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App engine={engine} animationEngine={animationEngine} />} />
          <Route
            path="/ai_editor_enginer/video"
            element={<VideoEditorPage engine={engine} animationEngine={animationEngine} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
);
