import { describe, expect, it, afterAll } from 'vitest';
import { readTrackTags, readTracks } from '../../../src/main/tags/reader';
import { copyFixture, cleanupTmp } from '../../helpers/tmpCopy';

afterAll(() => cleanupTmp());

const FORMATS = ['sample.mp3', 'sample.flac', 'sample.m4a', 'sample.ogg', 'sample.opus', 'sample.wav'];

describe('readTrackTags', () => {
  it.each(FORMATS)('%s を読み、未設定フィールドが空文字と null になる', (name) => {
    const tags = readTrackTags(copyFixture(name));
    expect(tags.fileName).toBe(name);
    expect(tags.title).toBe('');
    expect(tags.artist).toBe('');
    expect(tags.trackNumber).toBeNull();
    expect(tags.year).toBeNull();
    expect(tags.hasArtwork).toBe(false);
    expect(tags.durationSec).toBeGreaterThan(0);
  });
});

describe('readTracks', () => {
  it('読めないファイルを failures に分け、読めたものは tracks に返す', () => {
    const ok = copyFixture('sample.mp3');
    const missing = ok.replace('sample.mp3', 'does-not-exist.mp3');
    const result = readTracks([ok, missing]);
    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0].path).toBe(ok);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].path).toBe(missing);
  });
});

describe('音質情報', () => {
  it('FLAC からビット深度とサンプリング周波数を読む', () => {
    const tags = readTrackTags(copyFixture('sample.flac'));
    expect(tags.bitDepth).toBe(16);
    expect(tags.sampleRate).toBe(44100);
  });

  it('ハイレゾ音源を読み分けられる', () => {
    const tags = readTrackTags(copyFixture('sample-hires.flac'));
    expect(tags.bitDepth).toBe(24);
    expect(tags.sampleRate).toBe(96000);
  });

  it('MP4 はコーデック側からビット深度を拾う', () => {
    const tags = readTrackTags(copyFixture('sample.m4a'));
    expect(tags.bitDepth).toBeGreaterThan(0);
    expect(tags.sampleRate).toBe(44100);
  });
});
