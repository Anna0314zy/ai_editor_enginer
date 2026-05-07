import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined
  // Order matters: match specific packages before generic `react`
  if (id.includes('react-dom')) return 'react-vendor'
  if (id.includes('react-moveable') || id.includes('@daybrush')) {
    return 'moveable'
  }
  if (id.includes('@dnd-kit')) return 'dnd-kit'
  if (id.includes('gsap')) return 'gsap'
  if (/[/\\]react[/\\]/.test(id) || id.includes('scheduler')) return 'react-vendor'
  return undefined
}

export default defineConfig({
  plugins: [react()],
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
})
