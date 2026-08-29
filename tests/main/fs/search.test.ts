import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { searchDirectories } from '../../../src/main/fs/search';
import { cleanupTmp, makeTmpDir } from '../../helpers/tmpCopy';

const ROOT = makeTmpDir();

beforeAll(() => {
  mkdirSync(join(ROOT, 'Label A', 'Compilation One'), { recursive: true });
  mkdirSync(join(ROOT, 'Label A', 'Compilation Two'), { recursive: true });
  mkdirSync(join(ROOT, 'Label B', 'Album Angel'), { recursive: true });
  mkdirSync(join(ROOT, 'Label B', 'Deep', 'Deeper', 'Compilation Three'), { recursive: true });
  writeFileSync(join(ROOT, 'Compilation.mp3'), '');
});

afterAll(() => cleanupTmp());

describe('searchDirectories', () => {
  it('階層をまたいでフォルダ名の部分一致を集める', () => {
    const found = searchDirectories(ROOT, 'compilation').map((path) =>
      path.replace(ROOT, '').replace(/^[\\/]/, ''),
    );
    expect(found).toContain(join('Label A', 'Compilation One'));
    expect(found).toContain(join('Label A', 'Compilation Two'));
    expect(found).toContain(join('Label B', 'Deep', 'Deeper', 'Compilation Three'));
  });

  it('ファイルは対象にしない', () => {
    const found = searchDirectories(ROOT, 'compilation');
    expect(found.some((path) => path.endsWith('.mp3'))).toBe(false);
  });

  it('大文字小文字を区別しない', () => {
    expect(searchDirectories(ROOT, 'ALBUM ANGEL')).toHaveLength(1);
  });

  it('検索語が空なら何も返さない', () => {
    expect(searchDirectories(ROOT, '   ')).toEqual([]);
  });

  it('一致しなければ空を返す', () => {
    expect(searchDirectories(ROOT, 'そんなフォルダはない')).toEqual([]);
  });

  it('件数の上限を守る', () => {
    expect(searchDirectories(ROOT, 'a', 2)).toHaveLength(2);
  });

  it('読めないルートでも例外を投げない', () => {
    expect(searchDirectories('C:/nowhere/none', 'compilation')).toEqual([]);
  });
});
