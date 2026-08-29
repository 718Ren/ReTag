import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RENDERER_ROOT = join(process.cwd(), 'src', 'renderer');

function collectSourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectSourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) found.push(full);
  }
  return found;
}

function importSpecifiers(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

describe('renderer のモジュール境界', () => {
  const files = collectSourceFiles(RENDERER_ROOT);

  it('走査対象のファイルが存在する', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('main プロセスのモジュールを import しない', () => {
    // main のモジュールは node:fs などを読み込むため、renderer に混ざると
    // 「Module has been externalized for browser compatibility」で画面が真っ白になる
    const offenders = files.filter((file) =>
      importSpecifiers(readFileSync(file, 'utf8')).some((specifier) =>
        specifier.replace(/\\/g, '/').includes('/main/'),
      ),
    );

    expect(offenders).toEqual([]);
  });

  it('Node の組み込みモジュールを import しない', () => {
    const offenders = files.filter((file) =>
      importSpecifiers(readFileSync(file, 'utf8')).some((specifier) =>
        specifier.startsWith('node:'),
      ),
    );

    expect(offenders).toEqual([]);
  });
});

describe('preload のパス整合性', () => {
  it('main が読む preload のファイル名がビルド設定の出力名と一致する', () => {
    // sandbox: true の preload は CJS でなければならず、"type": "module" の下では
    // 拡張子まで含めて設定と main の記述が一致していないと ENOENT で無言で失敗する
    const mainSource = readFileSync(join(process.cwd(), 'src', 'main', 'index.ts'), 'utf8');
    const viteConfig = readFileSync(join(process.cwd(), 'electron.vite.config.ts'), 'utf8');

    const referenced = /preload\/([\w.-]+)['"]/.exec(mainSource)?.[1];
    const built = /entryFileNames:\s*['"]([\w.-]+)['"]/.exec(viteConfig)?.[1];

    expect(referenced).toBeDefined();
    expect(built).toBeDefined();
    expect(referenced).toBe(built);
  });
});
