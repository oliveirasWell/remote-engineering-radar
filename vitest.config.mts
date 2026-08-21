import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

const vitestConfig = defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./test/setup.ts'],
    include: ['{app,components,lib}/**/*.test.{ts,tsx}'],
    alias: {
      'server-only': fileURLToPath(
        new URL('./test/server-only-stub.ts', import.meta.url),
      ),
    },
  },
});

export default vitestConfig;
