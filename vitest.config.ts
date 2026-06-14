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
    ],
    environmentMatchGlobs: [
      ['supabase/**', 'node'],
    ],
    testTimeout: 30000,
    pool: 'forks',
  },
});
