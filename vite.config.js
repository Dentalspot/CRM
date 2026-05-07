import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true,
    cors: true,
    port: 3000,
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Sourcemaps en prod para Sentry stack traces legibles.
    sourcemap: true,
    // Aviso si un chunk pasa 500KB (ayuda a detectar regresiones).
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      external: [
        '@babel/parser',
        '@babel/traverse',
        '@babel/generator',
        '@babel/types'
      ],
      output: {
        // Separar vendors pesados en chunks dedicados → mejor cacheo entre
        // deploys (los chunks de vendor solo cambian cuando subís deps).
        manualChunks: {
          // React + Router (~140 KB gzip) — cachea forever entre deploys.
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Supabase JS SDK (~80 KB gzip).
          'vendor-supabase': ['@supabase/supabase-js'],

          // Animations — usado en varias páginas (motion.div).
          'vendor-motion': ['framer-motion'],

          // Charts (~100 KB gzip) — solo si la página los usa.
          'vendor-charts': ['recharts'],

          // Date utils — tree-shakeable pero igual aislarlo ayuda al cache.
          'vendor-dates': ['date-fns'],

          // UI primitives Radix — varios módulos chicos sumando bastante.
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-slot',
            '@radix-ui/react-label',
          ],
        },
      },
    },
  },
});
