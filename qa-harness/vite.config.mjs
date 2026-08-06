import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

export default defineConfig({
  root: __dirname,
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': path.resolve(repoRoot, 'src'),
    },
  },
  css: {
    postcss: path.resolve(repoRoot, 'postcss.config.mjs'),
  },
  server: {
    port: 5183,
    strictPort: true,
  },
})
