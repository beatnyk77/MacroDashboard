/* eslint-disable no-undef */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'supabase/functions/_shared/__tests__/**/*.test.ts',
      // Colocated edge-function regression tests (pre-launch + existing ingest-fred pattern)
      'supabase/functions/**/index.test.ts',
      // gsc-sync's auth logic lives in a sibling module, not index.ts
      'supabase/functions/gsc-sync/*.test.ts',
      'scripts/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    environmentMatchGlobs: [
      ['supabase/**', 'node'],
    ],
    testTimeout: 30000,
    pool: 'forks',
  },
});
