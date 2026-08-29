import { describe, expect, it, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { File } from 'node-taglib-sharp';
import { applyArtwork, imageMimeType } from '../../../src/main/tags/artwork';
import { readTrackTags } from '../../../src/main/tags/reader';
import { copyFixture, fixturePath, cleanupTmp } from '../../helpers/tmpCopy';

afterAll(() => cleanupTmp());

const FORMATS = ['sample.mp3', 'sample.flac', 'sample.m4a', 'sample.ogg', 'sample.opus', 'sample.wav'];

describe('imageMimeType', () => {
  it('webp を image/webp と判定する', () => {
    expect(imageMimeType('C:/x/cover.webp')).toBe('image/webp');
  });

  it('大文字の拡張子も扱える', () => {
    expect(imageMimeType('C:/x/COVER.JPG')).toBe('image/jpeg');
  });
});

describe('applyArtwork', () => {
  it.each(FORMATS)('%s に画像を埋め込み、原寸のバイト列を読み戻せる', (name) => {
    const audioPath = copyFixture(name);
    const imagePath = fixturePath('cover.png');

    const results = applyArtwork([audioPath], imagePath);
    expect(results[0].ok).toBe(true);
    expect(readTrackTags(audioPath).hasArtwork).toBe(true);

    const expected = readFileSync(imagePath);
    const file = File.createFromPath(audioPath);
    try {
      const picture = file.tag.pictures[0];
      expect(picture.mimeType).toBe('image/png');
      expect(Buffer.from(picture.data.toByteArray())).toEqual(expected);
    } finally {
      file.dispose();
    }
  });

  it('webp も画像として埋め込む', () => {
    const audioPath = copyFixture('sample.mp3');
    applyArtwork([audioPath], fixturePath('cover.webp'));

    const file = File.createFromPath(audioPath);
    try {
      expect(file.tag.pictures[0].mimeType).toBe('image/webp');
    } finally {
      file.dispose();
    }
  });

  it('既存のアートを上書きし、枚数を増やさない', () => {
    const audioPath = copyFixture('sample.mp3');
    applyArtwork([audioPath], fixturePath('cover.png'));
    applyArtwork([audioPath], fixturePath('cover.webp'));

    const file = File.createFromPath(audioPath);
    try {
      expect(file.tag.pictures).toHaveLength(1);
      expect(file.tag.pictures[0].mimeType).toBe('image/webp');
    } finally {
      file.dispose();
    }
  });

  it('複数ファイルに適用し、失敗分だけ ok:false になる', () => {
    const a = copyFixture('sample.mp3');
    const b = copyFixture('sample.flac');
    const results = applyArtwork([a, b, 'C:/nowhere/none.mp3'], fixturePath('cover.png'));

    expect(results).toHaveLength(3);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(true);
    expect(results[2].ok).toBe(false);
  });
});
