import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const MAX_DEPTH = 8;
const DEFAULT_LIMIT = 200;

/**
 * ルート配下のフォルダ名を再帰的に探す。
 * ライブラリ全体（実測で 924 フォルダ）を歩いてもキャッシュが温まっていれば
 * 50ms 程度なので、検索語が入った時だけ都度歩く。
 */
export function searchDirectories(
  root: string,
  query: string,
  limit: number = DEFAULT_LIMIT,
): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];

  const found: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > MAX_DEPTH || found.length >= limit) return;

    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      // 読めないフォルダは飛ばす。検索全体を失敗させない
      return;
    }

    for (const entry of entries) {
      if (found.length >= limit) return;
      if (!entry.isDirectory()) continue;

      const path = join(dir, entry.name);
      if (entry.name.toLowerCase().includes(needle)) found.push(path);
      walk(path, depth + 1);
    }
  }

  walk(root, 0);
  return found;
}
