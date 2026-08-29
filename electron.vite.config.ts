import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // sandbox: true の preload は CommonJS でなければ読み込めない。
        // package.json の "type": "module" のままだと既定で .mjs が出るため、
        // 拡張子まで含めて明示する（main 側の参照と一致させること）。
        output: {
          format: 'cjs',
          entryFileNames: 'index.cjs',
        },
      },
    },
  },
  renderer: { plugins: [react()] },
});
