import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // workspace リンクの shared は CJS 出力のため、commonjs 変換の対象に含める
  build: {
    commonjsOptions: { include: [/shared/, /node_modules/] },
  },
  optimizeDeps: {
    include: ['shared'],
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // エントリとルータはテスト対象外 (dev/実機スモークで検証する薄い glue)
      exclude: ['src/**/*.test.*', 'src/index.tsx', 'src/Router.tsx'],
      // docs/test-cases.md §4 のテスト目標
      thresholds: { statements: 95, lines: 95, functions: 90, branches: 80 },
    },
  },
});
