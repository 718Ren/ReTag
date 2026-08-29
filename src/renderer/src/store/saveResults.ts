import type { WriteResult } from '../../../shared/types';

/**
 * タグとアートワークは別々に書き込むため、同じ曲の結果が2件出ることがある。
 * 件数は「何曲を保存したか」で数えたいので、パス単位にまとめる。
 * 片方でも失敗していればその曲は失敗として扱う。
 */
export function combineResults(results: WriteResult[]): WriteResult[] {
  const byPath = new Map<string, WriteResult>();

  for (const result of results) {
    const existing = byPath.get(result.path);
    if (!existing || (existing.ok && !result.ok)) {
      byPath.set(result.path, result);
    }
  }

  return [...byPath.values()];
}

/** 入力欄にフォーカスがある間は Ctrl+A を文字選択として通す */
export function isEditableTarget(target: { tagName?: string } | null): boolean {
  const tagName = target?.tagName;
  return tagName === 'INPUT' || tagName === 'TEXTAREA';
}
