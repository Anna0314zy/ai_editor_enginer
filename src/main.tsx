import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { StoreProvider } from './store'
import { createEngine } from './engine'
import { AnimationEngine, WebAnimationAdapter } from './animation'

const engine = createEngine();
if (import.meta.env.NODE_ENV === 'development') {
  (window as any)._engine = engine;
}

const animationEngine = new AnimationEngine(new WebAnimationAdapter());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider engine={engine}>
      <App engine={engine} animationEngine={animationEngine} />
    </StoreProvider>
  </StrictMode>,
)
