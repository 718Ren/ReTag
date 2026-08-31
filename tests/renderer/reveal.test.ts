// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { farthestCorner, revealTheme } from '../../src/renderer/src/store/reveal';

function stubMotion(reduced: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({ matches: query.includes('prefers-reduced-motion') && reduced }) as MediaQueryList,
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
  // 既定では View Transitions を持たない環境として扱う
  Reflect.deleteProperty(document, 'startViewTransition');
});

describe('farthestCorner', () => {
  it('起点から一番遠い角までの距離を返す', () => {
    // 左上が起点なら、対角の右下までが最遠。3-4-5 の三角形になる
    expect(farthestCorner({ x: 0, y: 0 }, 30, 40)).toBe(50);
  });

  it('中央が起点でも取りこぼさない', () => {
    expect(farthestCorner({ x: 50, y: 50 }, 100, 100)).toBeCloseTo(70.71, 1);
  });
});

describe('revealTheme', () => {
  it('View Transitions が無ければそのまま切り替える', () => {
    stubMotion(false);
    const apply = vi.fn();
    revealTheme({ x: 10, y: 10 }, apply);
    expect(apply).toHaveBeenCalledOnce();
  });

  it('動きを控えたい設定なら演出せずに切り替える', () => {
    stubMotion(true);
    const start = vi.fn();
    Reflect.set(document, 'startViewTransition', start);

    const apply = vi.fn();
    revealTheme({ x: 10, y: 10 }, apply);

    expect(apply).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
  });

  it('使える環境では View Transitions に任せる', () => {
    stubMotion(false);
    const start = vi.fn((_callback: () => void) => ({ ready: Promise.resolve() }));
    Reflect.set(document, 'startViewTransition', start);

    const apply = vi.fn();
    revealTheme({ x: 10, y: 10 }, apply);

    expect(start).toHaveBeenCalledOnce();
    // 切り替え自体は startViewTransition に渡した関数の中で起きる
    expect(apply).not.toHaveBeenCalled();
    start.mock.calls[0][0]();
    expect(apply).toHaveBeenCalledOnce();
  });

  it('演出が始められなくても切り替えは通す', () => {
    stubMotion(false);
    Reflect.set(document, 'startViewTransition', () => {
      throw new Error('使えません');
    });

    const apply = vi.fn();
    expect(() => revealTheme({ x: 10, y: 10 }, apply)).not.toThrow();
    expect(apply).toHaveBeenCalledOnce();
  });
});
