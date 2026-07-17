import { defineConfig } from 'vite';

export default defineConfig({
  base: '/vepa-v3/',
  root: '.',
  build: {
    outDir: '.dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    host: true,
  },
  worker: {
    format: 'es',
  },
});
