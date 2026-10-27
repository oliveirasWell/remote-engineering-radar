import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const vitestConfig = defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    maxWorkers: 4,
    setupFiles: ['./test/setup.ts'],
    // Mirrors CI so pages take their database-backed path; tests that need
    // no database stub it empty.
    env: { DATABASE_URL: 'postgres://postgres@127.0.0.1:5432/radar' },
    include: ['{app,components,lib,scripts}/**/*.test.{ts,tsx}'],
    alias: {
      'server-only': fileURLToPath(
        new URL('./test/server-only-stub.ts', import.meta.url),
      ),
    },
  },
});

export default vitestConfig;
