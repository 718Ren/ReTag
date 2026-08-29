import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // globals を有効にすると @testing-library/react が afterEach の cleanup を
    // 自動登録する。無効のままだとテスト間で DOM が残り、getByRole が重複で落ちる。
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
});
