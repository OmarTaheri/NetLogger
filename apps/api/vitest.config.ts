import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const apiRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: apiRoot,
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    fileParallelism: false,
    exclude: ['dist/**', 'node_modules/**'],
    include: ['tests/**/*.test.ts'],
  },
});
