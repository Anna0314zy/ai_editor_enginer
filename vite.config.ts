import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages project URL subpath. Local root deploy: `VITE_BASE=/ pnpm build`. */

function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  // Keep react/react-dom in the main graph — splitting them caused @dnd-kit to see React as undefined at runtime.
  if (id.includes('react-moveable') || id.includes('@daybrush')) {
    return 'moveable'
  }
  if (id.includes('@dnd-kit')) return 'dnd-kit'
  if (id.includes('gsap')) return 'gsap'
  return undefined
}

const AI_COURSEWARE_API_DEV = 'http://localhost:8000'
const AI_COURSEWARE_API_PROD = 'https://web-production-c427b.up.railway.app'

export default defineConfig(({ mode }) => ({
  base:'/ai_editor_enginer/',
  define: {
    __AI_COURSEWARE_DEFAULT_BASE_URL__: JSON.stringify(
      mode === 'production' ? AI_COURSEWARE_API_PROD : AI_COURSEWARE_API_DEV,
    ),
  },
  plugins: [react(), tailwindcss()],
  build: {
    // After splitting vendors, raise slightly so real regressions still surface
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks,
      },
      onwarn(warning, defaultHandler) {
        // Dependency places /*#__PURE__*/ where Rollup can't tree-shake it; safe to ignore
        if (
          typeof warning.message === 'string' &&
          (warning.message.includes('#__PURE__') || warning.message.includes('annotation that Rollup cannot interpret'))
        ) {
          return
        }
        defaultHandler(warning)
      },
    },
  },
}))
