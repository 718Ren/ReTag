import { describe, expect, it, beforeEach } from 'vitest';
import { addRoot, getRoots, isWithinRoots, resetRoots } from '../../src/main/roots';

beforeEach(() => resetRoots());

describe('isWithinRoots', () => {
  it('ルート配下のパスを許可する', () => {
    expect(isWithinRoots('C:/music/album/a.mp3', ['C:/music'])).toBe(true);
  });

  it('ルート自身を許可する', () => {
    expect(isWithinRoots('C:/music', ['C:/music'])).toBe(true);
  });

  it('ルート外のパスを拒否する', () => {
    expect(isWithinRoots('C:/other/a.mp3', ['C:/music'])).toBe(false);
  });

  it('.. で外へ抜けるパスを拒否する', () => {
    expect(isWithinRoots('C:/music/../secret/a.mp3', ['C:/music'])).toBe(false);
  });

  it('ルートが空なら何も許可しない', () => {
    expect(isWithinRoots('C:/music/a.mp3', [])).toBe(false);
  });
});

describe('addRoot / getRoots', () => {
  it('新しいルートを先頭に積み、重複を除く', () => {
    addRoot('C:/a');
    addRoot('C:/b');
    addRoot('C:/a');
    expect(getRoots()).toEqual(['C:/a', 'C:/b']);
  });
});
