import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
