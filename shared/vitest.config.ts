import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts は再エクスポートのみのバレル (ロジックなし)
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // コアロジックは 100% を維持する (docs/test-cases.md §4)
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
