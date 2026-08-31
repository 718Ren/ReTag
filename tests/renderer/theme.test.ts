// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { loadTheme, nextTheme, saveTheme, THEME_KEY } from '../../src/renderer/src/store/theme';

function stubSystem(prefersDark: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    (query: string) => ({ matches: query.includes('dark') && prefersDark }) as MediaQueryList,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('loadTheme', () => {
  it('選んだことがなければ OS の設定に従う', () => {
    stubSystem(true);
    expect(loadTheme()).toBe('dark');

    stubSystem(false);
    expect(loadTheme()).toBe('light');
  });

  it('選んだことがあればそちらを優先する', () => {
    stubSystem(true);
    localStorage.setItem(THEME_KEY, 'light');
    expect(loadTheme()).toBe('light');
  });

  it('壊れた値は無視して OS の設定に戻す', () => {
    stubSystem(true);
    localStorage.setItem(THEME_KEY, 'chartreuse');
    expect(loadTheme()).toBe('dark');
  });

  // matchMedia が無い環境（古い jsdom など）でも落とさない
  it('OS の設定を読めないときは light にする', () => {
    vi.stubGlobal('matchMedia', undefined);
    expect(loadTheme()).toBe('light');
  });
});

describe('saveTheme', () => {
  it('選択を覚える', () => {
    saveTheme('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('書き込めなくても落ちない', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('保存できません');
    });
    expect(() => saveTheme('light')).not.toThrow();
  });
});

describe('nextTheme', () => {
  it('押すたびに入れ替わる', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });
});
