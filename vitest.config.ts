import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'scripts/**/*.test.mjs',
      'packages/shared/**/*.test.ts',
      'packages/shared/**/*.spec.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 15_000,
  },
});
