import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/engine/**', 'src/modules/**'],
      exclude: ['src/server.ts', 'src/routes/**'],
      reporter: ['text', 'text-summary'],
    },
  },
});
