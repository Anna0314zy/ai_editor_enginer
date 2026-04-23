# Initialize Slides Editor Project

## Step 1: Setup Vite + React 18 + TypeScript

Run command to initialize the project:
```bash
npm create vite@latest . -- --template react-ts
```

This will create:
- `package.json` with React 18 and TypeScript
- `vite.config.ts`
- Basic project structure

## Step 2: Configure TypeScript Strict Mode

Update `tsconfig.json` with strict compiler options:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Step 3: Create Folder Structure

Create the following directories under `src/`:
```
src/
├── engine/        # Engine core (framework-agnostic)
├── renderer/      # Pure rendering functions (data → UI)
├── components/    # React UI components
├── store/         # State management
└── types/         # TypeScript type definitions
```

## Step 4: Create Basic Type Definitions

**File: `src/types/index.ts`**
```typescript
export interface Element {
  id: string;
  type: 'shape' | 'image' | 'text' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  props: Record<string, any>;
}

export interface Slide {
  id: string;
  name: string;
  elementIds: string[];
}

export interface Document {
  slides: Slide[];
  elements: Record<string, Element>;
}
```

## Step 5: Create Canvas Component

**File: `src/components/Canvas.tsx`**
```tsx
import React from 'react';

interface CanvasProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

const Canvas: React.FC<CanvasProps> = ({ 
  width = 1920, 
  height = 1080, 
  children 
}) => {
  return (
    <div 
      style={{ 
        width, 
        height, 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
      }}
    >
      {children}
    </div>
  );
};

export default Canvas;
```

## Step 6: Create Basic App.tsx

**File: `src/App.tsx`**
```tsx
import Canvas from './components/Canvas';

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5' 
    }}>
      <Canvas>
        <div style={{ 
          position: 'absolute', 
          left: 100, 
          top: 100, 
          width: 200, 
          height: 100, 
          backgroundColor: '#4a90d9',
          borderRadius: 8
        }}>
          Hello Slides Editor
        </div>
      </Canvas>
    </div>
  );
}

export default App;
```

## Step 7: Update Main Entry Point

**File: `src/main.tsx`** (already exists, verify it uses React 18 createRoot)
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## Step 8: Clean Up Unnecessary Files

Remove default Vite template files:
- Remove `src/assets/` (optional, can keep for future use)
- Clean `src/index.css` to minimal styles
- Update `index.html` title to "Slides Editor"

## Step 9: Verify Project Setup

Run:
```bash
npm install
npm run dev
```

Verify:
- TypeScript compiles without errors
- Development server starts successfully
- Canvas component renders on screen

---

**Architecture Compliance:**
- ✅ No React inside engine folder (framework-agnostic)
- ✅ Type definitions separated in `src/types`
- ✅ Canvas component is pure (data → UI)
- ✅ No extra libraries beyond Vite + React + TypeScript
- ✅ Folder structure supports future engine/renderer/store separation
