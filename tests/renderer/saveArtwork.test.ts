// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { actions, __getStateForTest, __setStateForTest } from '../../src/renderer/src/store/appStore';
import type { TrackTags } from '../../src/shared/types';

function track(path: string): TrackTags {
  return {
    path,
    fileName: path.split('/').pop()!,
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
  };
}

const writeTracks = vi.fn();
const applyArtwork = vi.fn();
const readTracks = vi.fn();

beforeEach(() => {
  writeTracks.mockReset().mockResolvedValue([{ path: 'C:/m/1.mp3', ok: true }]);
  applyArtwork.mockReset().mockResolvedValue([{ path: 'C:/m/1.mp3', ok: true }]);
  readTracks.mockReset().mockResolvedValue({ tracks: [track('C:/m/1.mp3')], failures: [] });

  Object.defineProperty(window, 'api', {
    configurable: true,
    value: { writeTracks, applyArtwork, readTracks },
  });

  __setStateForTest({
    tracks: [track('C:/m/1.mp3')],
    selectedPaths: ['C:/m/1.mp3'],
    touched: {},
    renamePrefix: '',
    pendingArtwork: null,
    selectedImage: 'C:/m/cover.jpg',
    status: '',
  });
});

describe('保存時のアートワーク', () => {
  it('画像を選び直していなければ書き込まない', async () => {
    __setStateForTest({ touched: { title: '新タイトル' } });
    await actions.save();

    expect(writeTracks).toHaveBeenCalledTimes(1);
    expect(applyArtwork).not.toHaveBeenCalled();
  });

  it('画像を選び直したら選択中の曲に適用する', async () => {
    actions.selectImage('C:/m/other.png');
    await actions.save();

    expect(applyArtwork).toHaveBeenCalledWith(['C:/m/1.mp3'], 'C:/m/other.png');
  });

  it('タグを触っていなくても画像だけで保存できる', async () => {
    actions.selectImage('C:/m/other.png');
    await actions.save();

    expect(writeTracks).not.toHaveBeenCalled();
    expect(applyArtwork).toHaveBeenCalledTimes(1);
  });

  it('保存後は適用予定を消す（次の保存で二重に書かない）', async () => {
    actions.selectImage('C:/m/other.png');
    await actions.save();
    applyArtwork.mockClear();

    __setStateForTest({ touched: { title: 'もう一度' } });
    await actions.save();

    expect(applyArtwork).not.toHaveBeenCalled();
  });

  it('タグと画像を両方書いても件数は曲数で数える', async () => {
    __setStateForTest({ touched: { title: '新タイトル' } });
    actions.selectImage('C:/m/other.png');
    await actions.save();

    expect(__getStateForTest().status).toBe('1件を保存しました');
  });

  it('選択が空なら何も書かない', async () => {
    __setStateForTest({ selectedPaths: [] });
    actions.selectImage('C:/m/other.png');
    await actions.save();

    expect(writeTracks).not.toHaveBeenCalled();
    expect(applyArtwork).not.toHaveBeenCalled();
  });

  it('画像が読めなければ状況を伝え、適用予定は残す', async () => {
    applyArtwork.mockRejectedValue(new Error('ENOENT'));
    actions.selectImage('C:/m/other.png');
    await actions.save();

    expect(__getStateForTest().status).toContain('画像を読み込めませんでした');
    expect(__getStateForTest().pendingArtwork).toBe('C:/m/other.png');
  });
});

describe('selectAllTracks', () => {
  it('フォルダ内の全曲を選択する', () => {
    __setStateForTest({
      tracks: [track('C:/m/1.mp3'), track('C:/m/2.mp3')],
      selectedPaths: [],
    });

    actions.selectAllTracks();

    expect(__getStateForTest().selectedPaths).toEqual(['C:/m/1.mp3', 'C:/m/2.mp3']);
  });
});
