import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './store'
import { createEngine } from './engine'
import { AnimationEngine, WebAnimationAdapter } from './animation'
import { aiCoursewarePlugin } from './plugins/aiCourseware'
import { videoPlugin } from './plugins/videoPlugin'
import { setPluginRegistry } from './renderer'

const engine = createEngine();
engine.use(aiCoursewarePlugin);
engine.use(videoPlugin);
setPluginRegistry(engine.pluginRegistry);
(window as any)._engine = engine;

const animationEngine = new AnimationEngine(new WebAnimationAdapter());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider engine={engine}>
      <App engine={engine} animationEngine={animationEngine} />
    </StoreProvider>
  </StrictMode>,
)
