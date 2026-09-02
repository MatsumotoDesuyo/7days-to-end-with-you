import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts (HTTP 層) は子プロセス起動のブラックボックス API テストで
      // 検証するため、プロセス内カバレッジの対象外 (docs/test-cases.md §4)
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      // docs/test-cases.md §4 のテスト目標
      thresholds: { statements: 95, lines: 95, functions: 90, branches: 80 },
    },
  },
});
