import { describe, expect, it } from 'vitest';
import {
  expandExclusive,
  filterDirs,
  isExpanded,
  nameClickAction,
  toggleExpanded,
} from '../../src/renderer/src/store/tree';

describe('toggleExpanded', () => {
  it('閉じているフォルダを開く', () => {
    expect(toggleExpanded([], 'C:/m/a')).toEqual(['C:/m/a']);
  });

  it('開いているフォルダを閉じる', () => {
    expect(toggleExpanded(['C:/m/a'], 'C:/m/a')).toEqual([]);
  });

  it('他のフォルダの状態を変えない', () => {
    expect(toggleExpanded(['C:/m/a', 'C:/m/b'], 'C:/m/a')).toEqual(['C:/m/b']);
  });

  it('閉じても子フォルダの開閉状態は保持する（開き直しても元に戻る）', () => {
    const opened = ['C:/m/a', 'C:/m/a/disc1'];
    const closed = toggleExpanded(opened, 'C:/m/a');
    expect(closed).toEqual(['C:/m/a/disc1']);
    expect(toggleExpanded(closed, 'C:/m/a')).toContain('C:/m/a/disc1');
  });
});

describe('isExpanded', () => {
  it('開いているかどうかを返す', () => {
    expect(isExpanded(['C:/m/a'], 'C:/m/a')).toBe(true);
    expect(isExpanded(['C:/m/a'], 'C:/m/b')).toBe(false);
  });
});

describe('nameClickAction', () => {
  it('別のフォルダなら選択して開く', () => {
    expect(nameClickAction('C:/m/b', { currentDir: 'C:/m/a', expanded: ['C:/m/a'] })).toBe('select');
  });

  it('選択中で開いているフォルダをもう一度押したら閉じる', () => {
    expect(nameClickAction('C:/m/a', { currentDir: 'C:/m/a', expanded: ['C:/m/a'] })).toBe('collapse');
  });

  it('選択中でも閉じているなら開く', () => {
    expect(nameClickAction('C:/m/a', { currentDir: 'C:/m/a', expanded: [] })).toBe('select');
  });

  it('何も選択していなければ選択して開く', () => {
    expect(nameClickAction('C:/m/a', { currentDir: null, expanded: [] })).toBe('select');
  });
});

describe('expandExclusive', () => {
  it('別の枝を開くと前に開いていた枝を閉じる', () => {
    expect(expandExclusive(['E:/m', 'E:/m/a'], 'E:/m/b')).toEqual(['E:/m', 'E:/m/b']);
  });

  it('先祖は閉じない（開いた自分が隠れてしまうため）', () => {
    expect(expandExclusive(['E:/m', 'E:/m/a'], 'E:/m/a/disc1')).toEqual([
      'E:/m',
      'E:/m/a',
      'E:/m/a/disc1',
    ]);
  });

  it('孫を開いていた枝から別の枝へ移ると孫ごと閉じる', () => {
    expect(expandExclusive(['E:/m', 'E:/m/a', 'E:/m/a/disc1'], 'E:/m/b')).toEqual([
      'E:/m',
      'E:/m/b',
    ]);
  });

  it('ルート自身を開き直すと配下は閉じる', () => {
    expect(expandExclusive(['E:/m', 'E:/m/a'], 'E:/m')).toEqual(['E:/m']);
  });

  it('区切り文字が混ざっていても先祖と判定する', () => {
    expect(expandExclusive(['E:\\m'], 'E:/m/a')).toEqual(['E:\\m', 'E:/m/a']);
  });

  it('名前が前方一致するだけの別フォルダは先祖扱いしない', () => {
    expect(expandExclusive(['E:/m/album'], 'E:/m/album2')).toEqual(['E:/m/album2']);
  });
});

describe('filterDirs', () => {
  const dirs = ['C:/m/Compilation One', 'C:/m/Compilation Two', 'C:/m/Album Angel', 'C:/m/謎のアルバム'];

  it('検索語が空なら全件返す', () => {
    expect(filterDirs(dirs, '')).toEqual(dirs);
  });

  it('フォルダ名の部分一致で絞る', () => {
    expect(filterDirs(dirs, 'compilation')).toEqual(['C:/m/Compilation One', 'C:/m/Compilation Two']);
  });

  it('大文字小文字を区別しない', () => {
    expect(filterDirs(dirs, 'ANGEL')).toEqual(['C:/m/Album Angel']);
    expect(filterDirs(dirs, 'angel')).toEqual(['C:/m/Album Angel']);
  });

  it('日本語も絞れる', () => {
    expect(filterDirs(dirs, 'アルバム')).toEqual(['C:/m/謎のアルバム']);
  });

  it('親フォルダ名の一致では絞り込まない（対象はフォルダ自身の名前）', () => {
    expect(filterDirs(dirs, 'C:/m')).toEqual([]);
  });

  it('Windows のパス区切りでもフォルダ名だけを見る', () => {
    expect(filterDirs(['C:\\lib\\Album Angel'], 'angel')).toEqual(['C:\\lib\\Album Angel']);
    // 親フォルダ名（lib）に一致しても拾わない
    expect(filterDirs(['C:\\lib\\Album Angel'], 'lib')).toEqual([]);
  });

  it('前後の空白は無視する', () => {
    expect(filterDirs(dirs, '  compilation  ')).toEqual(['C:/m/Compilation One', 'C:/m/Compilation Two']);
  });
});
