import { describe, expect, it } from 'vitest';
import { buildRenameUndo, buildTagUndo } from '../../src/renderer/src/store/undo';
import type { TrackTags } from '../../src/shared/types';

function track(overrides: Partial<TrackTags>): TrackTags {
  return {
    path: 'C:/Music/1.flac',
    fileName: '1.flac',
    durationSec: 100,
    title: '',
    artist: '',
    album: '',
    albumArtist: '',
    trackNumber: null,
    trackCount: null,
    discNumber: null,
    discCount: null,
    year: null,
    genre: '',
    hasArtwork: false,
    bitDepth: 16,
    sampleRate: 44100,
    ...overrides,
  };
}

describe('buildTagUndo', () => {
  it('書き換えるフィールドの変更前の値を拾う', () => {
    const tracks = [track({ path: 'C:/Music/1.flac', album: '旧アルバム', title: '曲1' })];
    const undo = buildTagUndo(tracks, [{ path: 'C:/Music/1.flac', changes: { album: '新アルバム' } }]);

    expect(undo).toEqual([{ path: 'C:/Music/1.flac', changes: { album: '旧アルバム' } }]);
  });

  it('書き換えないフィールドは持たない', () => {
    const tracks = [track({ path: 'C:/Music/1.flac', album: '旧', title: '曲1' })];
    const undo = buildTagUndo(tracks, [{ path: 'C:/Music/1.flac', changes: { album: '新' } }]);

    expect(undo[0].changes).not.toHaveProperty('title');
  });

  it('複数曲それぞれの変更前の値を持つ', () => {
    const tracks = [
      track({ path: 'C:/Music/1.flac', album: 'A' }),
      track({ path: 'C:/Music/2.flac', album: 'B' }),
    ];
    const undo = buildTagUndo(tracks, [
      { path: 'C:/Music/1.flac', changes: { album: 'X' } },
      { path: 'C:/Music/2.flac', changes: { album: 'X' } },
    ]);

    expect(undo).toEqual([
      { path: 'C:/Music/1.flac', changes: { album: 'A' } },
      { path: 'C:/Music/2.flac', changes: { album: 'B' } },
    ]);
  });

  it('数値フィールドの空も戻せる', () => {
    const tracks = [track({ path: 'C:/Music/1.flac', trackNumber: null })];
    const undo = buildTagUndo(tracks, [{ path: 'C:/Music/1.flac', changes: { trackNumber: 5 } }]);

    expect(undo[0].changes.trackNumber).toBeNull();
  });

  it('一覧に無いパスは対象にしない', () => {
    const tracks = [track({ path: 'C:/Music/1.flac' })];
    const undo = buildTagUndo(tracks, [{ path: 'C:/Music/9.flac', changes: { album: 'X' } }]);

    expect(undo).toEqual([]);
  });
});

describe('buildRenameUndo', () => {
  it('変更後のパスから元の名前へ戻す指示を作る', () => {
    const undo = buildRenameUndo([
      { path: 'C:/Music/label - 01.flac', newName: '01.flac' },
      { path: 'C:/Music/label - 02.flac', newName: '02.flac' },
    ]);

    expect(undo).toEqual([
      { path: 'C:/Music/01.flac', newName: 'label - 01.flac' },
      { path: 'C:/Music/02.flac', newName: 'label - 02.flac' },
    ]);
  });

  it('区切りがスラッシュのパスも扱える', () => {
    const undo = buildRenameUndo([{ path: 'C:/Music/a - 1.flac', newName: '1.flac' }]);
    expect(undo[0].path).toBe('C:/Music/1.flac');
  });

  it('空なら空を返す', () => {
    expect(buildRenameUndo([])).toEqual([]);
  });
});
