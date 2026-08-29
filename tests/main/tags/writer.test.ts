import { describe, expect, it, afterAll } from 'vitest';
import { writeTrackTags, writeTracks } from '../../../src/main/tags/writer';
import { readTrackTags } from '../../../src/main/tags/reader';
import { copyFixture, cleanupTmp } from '../../helpers/tmpCopy';

afterAll(() => cleanupTmp());

const FORMATS = ['sample.mp3', 'sample.flac', 'sample.m4a', 'sample.ogg', 'sample.opus', 'sample.wav'];

describe('writeTrackTags', () => {
  it.each(FORMATS)('%s に書いた値を読み戻せる', (name) => {
    const path = copyFixture(name);
    const result = writeTrackTags({
      path,
      changes: {
        title: 'タイトル',
        artist: 'アーティスト',
        album: 'アルバム',
        albumArtist: 'アルバムアーティスト',
        trackNumber: 3,
        trackCount: 12,
        discNumber: 1,
        discCount: 2,
        year: 2026,
        genre: 'Electronic',
      },
    });

    expect(result.ok).toBe(true);

    const tags = readTrackTags(path);
    expect(tags.title).toBe('タイトル');
    expect(tags.artist).toBe('アーティスト');
    expect(tags.album).toBe('アルバム');
    expect(tags.albumArtist).toBe('アルバムアーティスト');
    expect(tags.trackNumber).toBe(3);
    expect(tags.trackCount).toBe(12);
    expect(tags.discNumber).toBe(1);
    expect(tags.discCount).toBe(2);
    expect(tags.year).toBe(2026);
    expect(tags.genre).toBe('Electronic');
  });

  it.each(FORMATS)('%s で changes にないフィールドは元の値を保つ', (name) => {
    const path = copyFixture(name);
    writeTrackTags({ path, changes: { title: '元のタイトル', artist: '元のアーティスト' } });
    writeTrackTags({ path, changes: { album: '新しいアルバム' } });

    const tags = readTrackTags(path);
    expect(tags.title).toBe('元のタイトル');
    expect(tags.artist).toBe('元のアーティスト');
    expect(tags.album).toBe('新しいアルバム');
  });

  it('null を渡すとフィールドを消去できる', () => {
    const path = copyFixture('sample.mp3');
    writeTrackTags({ path, changes: { trackNumber: 5 } });
    writeTrackTags({ path, changes: { trackNumber: null } });
    expect(readTrackTags(path).trackNumber).toBeNull();
  });

  it('複数値フィールドは "; " で分割して格納し、同じ形で読み戻せる', () => {
    const path = copyFixture('sample.flac');
    writeTrackTags({ path, changes: { artist: 'A; B' } });
    expect(readTrackTags(path).artist).toBe('A; B');
  });

  it('存在しないファイルは ok:false を返す', () => {
    const result = writeTrackTags({ path: 'C:/nowhere/none.mp3', changes: { title: 'x' } });
    expect(result.ok).toBe(false);
  });
});

describe('writeTracks', () => {
  it('1件失敗しても残りを処理し、全件分の結果を返す', () => {
    const good = copyFixture('sample.mp3');
    const results = writeTracks([
      { path: good, changes: { title: 'ok' } },
      { path: 'C:/nowhere/none.mp3', changes: { title: 'ng' } },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].ok).toBe(true);
    expect(results[1].ok).toBe(false);
    expect(readTrackTags(good).title).toBe('ok');
  });
});
