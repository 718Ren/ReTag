import { describe, expect, it, afterAll } from 'vitest';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renameFiles } from '../../../src/main/fs/rename';
import { cleanupTmp, makeTmpDir } from '../../helpers/tmpCopy';

afterAll(() => cleanupTmp());

function makeFiles(names: string[]): string {
  const dir = makeTmpDir();
  for (const name of names) writeFileSync(join(dir, name), '');
  return dir;
}

describe('renameFiles', () => {
  it('指定した名前に変更する', () => {
    const dir = makeFiles(['a - 01.mp3']);
    const results = renameFiles([{ path: join(dir, 'a - 01.mp3'), newName: '01.mp3' }]);

    expect(results[0].ok).toBe(true);
    expect(existsSync(join(dir, '01.mp3'))).toBe(true);
    expect(existsSync(join(dir, 'a - 01.mp3'))).toBe(false);
  });

  it('名前が変わらない指定は何もせず成功として返す', () => {
    const dir = makeFiles(['01.mp3']);
    const results = renameFiles([{ path: join(dir, '01.mp3'), newName: '01.mp3' }]);

    expect(results[0].ok).toBe(true);
    expect(existsSync(join(dir, '01.mp3'))).toBe(true);
  });

  it('同名のファイルが既にあれば、そのファイルだけ失敗させる', () => {
    const dir = makeFiles(['a - 01.mp3', '01.mp3']);
    const results = renameFiles([{ path: join(dir, 'a - 01.mp3'), newName: '01.mp3' }]);

    expect(results[0].ok).toBe(false);
    expect(existsSync(join(dir, 'a - 01.mp3'))).toBe(true);
  });

  it('パス区切りを含む名前は拒否する', () => {
    const dir = makeFiles(['a - 01.mp3']);
    const results = renameFiles([{ path: join(dir, 'a - 01.mp3'), newName: '../01.mp3' }]);

    expect(results[0].ok).toBe(false);
    expect(existsSync(join(dir, 'a - 01.mp3'))).toBe(true);
  });

  it('1件失敗しても残りは処理する', () => {
    const dir = makeFiles(['a - 01.mp3', 'a - 02.mp3', '02.mp3']);
    const results = renameFiles([
      { path: join(dir, 'a - 01.mp3'), newName: '01.mp3' },
      { path: join(dir, 'a - 02.mp3'), newName: '02.mp3' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
    expect(existsSync(join(dir, '01.mp3'))).toBe(true);
  });

  it('存在しないファイルは失敗として返す', () => {
    const results = renameFiles([{ path: 'C:/nowhere/none.mp3', newName: '01.mp3' }]);
    expect(results[0].ok).toBe(false);
  });
});
