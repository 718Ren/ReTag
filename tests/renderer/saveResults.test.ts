import { describe, expect, it } from 'vitest';
import { combineResults, isEditableTarget } from '../../src/renderer/src/store/saveResults';
import type { WriteResult } from '../../src/shared/types';

describe('combineResults', () => {
  it('同じファイルへの複数回の書き込みを1件にまとめる', () => {
    const results: WriteResult[] = [
      { path: 'C:/m/1.mp3', ok: true },
      { path: 'C:/m/1.mp3', ok: true },
    ];
    expect(combineResults(results)).toEqual([{ path: 'C:/m/1.mp3', ok: true }]);
  });

  it('片方が失敗していれば失敗として扱う', () => {
    const results: WriteResult[] = [
      { path: 'C:/m/1.mp3', ok: true },
      { path: 'C:/m/1.mp3', ok: false, reason: 'locked', message: '使用中' },
    ];
    const combined = combineResults(results);
    expect(combined).toHaveLength(1);
    expect(combined[0].ok).toBe(false);
  });

  it('別のファイルは別件のまま残す', () => {
    const results: WriteResult[] = [
      { path: 'C:/m/1.mp3', ok: true },
      { path: 'C:/m/2.mp3', ok: true },
    ];
    expect(combineResults(results)).toHaveLength(2);
  });
});

describe('isEditableTarget', () => {
  it('input は編集中とみなす', () => {
    expect(isEditableTarget({ tagName: 'INPUT' })).toBe(true);
  });

  it('textarea も編集中とみなす', () => {
    expect(isEditableTarget({ tagName: 'TEXTAREA' })).toBe(true);
  });

  it('それ以外は編集中ではない', () => {
    expect(isEditableTarget({ tagName: 'DIV' })).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});
