import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { childFlags, listDirectory } from '../../../src/main/fs/directory';
import { compareNatural } from '../../../src/shared/naturalSort';
import { pickPreferredImage } from '../../../src/shared/imageCandidates';
import { cleanupTmp, makeTmpDir } from '../../helpers/tmpCopy';

const ROOT = makeTmpDir();

beforeAll(() => {
  mkdirSync(join(ROOT, 'Disc 2'), { recursive: true });
  mkdirSync(join(ROOT, 'Disc 10'), { recursive: true });
  for (const name of ['10.mp3', '2.mp3', 'a.flac', 'notes.txt', 'cover.jpg', 'back.png']) {
    writeFileSync(join(ROOT, name), '');
  }
});

afterAll(() => cleanupTmp());

describe('compareNatural', () => {
  it('数字を数値として比較する', () => {
    expect(['10.mp3', '2.mp3'].sort(compareNatural)).toEqual(['2.mp3', '10.mp3']);
  });
});

describe('listDirectory', () => {
  it('サブディレクトリを自然順で返す', () => {
    const listing = listDirectory(ROOT);
    expect(listing.dirs).toEqual([join(ROOT, 'Disc 2'), join(ROOT, 'Disc 10')]);
  });

  it('音声ファイルだけを自然順で返し、txt を含めない', () => {
    const listing = listDirectory(ROOT);
    expect(listing.audioFiles).toEqual([
      join(ROOT, '2.mp3'),
      join(ROOT, '10.mp3'),
      join(ROOT, 'a.flac'),
    ]);
  });

  it('画像ファイルだけを返す', () => {
    const listing = listDirectory(ROOT);
    expect(listing.imageFiles).toEqual([join(ROOT, 'back.png'), join(ROOT, 'cover.jpg')]);
  });
});

describe('pickPreferredImage', () => {
  it('cover を最優先する', () => {
    expect(pickPreferredImage(['C:/x/back.png', 'C:/x/cover.jpg'])).toBe('C:/x/cover.jpg');
  });

  it('cover がなければ folder を選ぶ', () => {
    expect(pickPreferredImage(['C:/x/zzz.png', 'C:/x/folder.jpg'])).toBe('C:/x/folder.jpg');
  });

  it('front と album もこの順で優先する', () => {
    expect(pickPreferredImage(['C:/x/album.png', 'C:/x/front.jpg'])).toBe('C:/x/front.jpg');
  });

  it('大文字小文字を区別しない', () => {
    expect(pickPreferredImage(['C:/x/zzz.png', 'C:/x/COVER.JPG'])).toBe('C:/x/COVER.JPG');
  });

  it('該当がなければ自然順の先頭を返す', () => {
    expect(pickPreferredImage(['C:/x/b.png', 'C:/x/a.png'])).toBe('C:/x/a.png');
  });

  it('空配列なら null を返す', () => {
    expect(pickPreferredImage([])).toBeNull();
  });
});

describe('childFlags', () => {
  it('サブフォルダを持つかどうかを返す', () => {
    expect(childFlags([join(ROOT, 'Disc 2'), ROOT])).toEqual({
      [join(ROOT, 'Disc 2')]: false,
      [ROOT]: true,
    });
  });

  it('音声や画像しかないフォルダは false', () => {
    expect(childFlags([join(ROOT, 'Disc 10')])[join(ROOT, 'Disc 10')]).toBe(false);
  });

  it('読めないフォルダは false にして例外を投げない', () => {
    expect(childFlags(['C:/nowhere/none'])).toEqual({ 'C:/nowhere/none': false });
  });
});
