import { describe, expect, it } from 'vitest';
import { buildEdits, commonFieldValues, MULTIPLE_VALUES } from '../../src/renderer/src/store/editing';
import type { TrackTags } from '../../src/shared/types';

function track(overrides: Partial<TrackTags>): TrackTags {
  return {
    path: 'C:/m/a.mp3',
    fileName: 'a.mp3',
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

describe('commonFieldValues', () => {
  it('全曲で一致する値はそのまま出す', () => {
    const state = commonFieldValues([
      track({ path: 'C:/m/1.mp3', album: 'Album X', title: 'A' }),
      track({ path: 'C:/m/2.mp3', album: 'Album X', title: 'B' }),
    ]);
    expect(state.values.album).toBe('Album X');
    expect(state.mixed.album).toBe(false);
  });

  it('値が割れるフィールドは空文字にし、mixed を立てる', () => {
    const state = commonFieldValues([
      track({ path: 'C:/m/1.mp3', title: 'A' }),
      track({ path: 'C:/m/2.mp3', title: 'B' }),
    ]);
    expect(state.values.title).toBe('');
    expect(state.mixed.title).toBe(true);
  });

  it('数値フィールドを文字列にし、null は空文字にする', () => {
    const state = commonFieldValues([track({ trackNumber: 3, year: null })]);
    expect(state.values.trackNumber).toBe('3');
    expect(state.values.year).toBe('');
  });

  it('選択が空なら全フィールド空文字・mixed なし', () => {
    const state = commonFieldValues([]);
    expect(state.values.title).toBe('');
    expect(state.mixed.title).toBe(false);
  });
});

describe('buildEdits', () => {
  it('触ったフィールドだけを全選択曲に書く', () => {
    const tracks = [
      track({ path: 'C:/m/1.mp3', title: 'A' }),
      track({ path: 'C:/m/2.mp3', title: 'B' }),
    ];
    const edits = buildEdits(tracks, { album: '新アルバム' });

    expect(edits).toHaveLength(2);
    expect(edits[0]).toEqual({ path: 'C:/m/1.mp3', changes: { album: '新アルバム' } });
    expect(edits[1].changes).toEqual({ album: '新アルバム' });
    expect(edits[0].changes).not.toHaveProperty('title');
  });

  it('触っていなければ空配列を返す', () => {
    expect(buildEdits([track({})], {})).toEqual([]);
  });

  it('数値フィールドの空文字は null に変換する', () => {
    const edits = buildEdits([track({ trackNumber: 5 })], { trackNumber: '' });
    expect(edits[0].changes.trackNumber).toBeNull();
  });

  it('数値フィールドの文字列は数値に変換する', () => {
    const edits = buildEdits([track({})], { year: '2026' });
    expect(edits[0].changes.year).toBe(2026);
  });

  it('プレースホルダ文字列そのものは書き込まない', () => {
    expect(buildEdits([track({})], { title: MULTIPLE_VALUES })).toEqual([]);
  });
});
