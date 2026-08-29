import { readFileSync, writeFileSync } from 'node:fs';

type Settings = {
  /** 最後に開いたライブラリの場所 */
  root: string;
};

/**
 * 開くフォルダを覚えておく。読めない・壊れている場合は既定値に落とす。
 * 設定が壊れているだけでアプリが起動しないのは困るため、例外は投げない。
 */
export function loadRoot(settingsFile: string, fallback: string): string {
  try {
    const parsed: unknown = JSON.parse(readFileSync(settingsFile, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null) return fallback;

    const { root } = parsed as Partial<Settings>;
    return typeof root === 'string' && root.length > 0 ? root : fallback;
  } catch {
    return fallback;
  }
}

export function saveRoot(settingsFile: string, root: string): void {
  try {
    writeFileSync(settingsFile, JSON.stringify({ root } satisfies Settings), 'utf8');
  } catch {
    // 保存できなくても次回また既定値から始まるだけなので、動作は続けられる
  }
}
