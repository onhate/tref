import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./src/__test__/globalSetup.ts'],
    setupFiles: ['./src/__test__/setupFile.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/migrations/**', '**/*.test.ts', '**/*.config.ts']
    },
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    testTimeout: 10_000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
