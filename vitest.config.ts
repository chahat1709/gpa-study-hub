import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
    css: false,
    pool: 'forks',
    maxWorkers: 1,
    isolate: true,
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
});
