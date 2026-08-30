// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { actions, __getStateForTest, __setStateForTest } from '../../src/renderer/src/store/appStore';
import type { TrackTags } from '../../src/shared/types';

function track(path: string, album: string): TrackTags {
  return {
    path,
    fileName: path.split('/').pop()!,
    durationSec: 100,
    title: '',
    artist: '',
    album,
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

const tracks = [track('C:/Music/1.flac', '旧A'), track('C:/Music/2.flac', '旧B')];

const writeTracks = vi.fn();
const renameFiles = vi.fn();
const readTracks = vi.fn();
const listDir = vi.fn();

beforeEach(() => {
  writeTracks.mockReset().mockResolvedValue([
    { path: 'C:/Music/1.flac', ok: true },
    { path: 'C:/Music/2.flac', ok: true },
  ]);
  renameFiles.mockReset().mockResolvedValue([{ path: 'C:/Music/1.flac', ok: true }]);
  readTracks.mockReset().mockResolvedValue({ tracks, failures: [] });
  listDir.mockReset().mockResolvedValue({ dirs: [], audioFiles: [], imageFiles: [] });

  Object.defineProperty(window, 'api', {
    configurable: true,
    value: { writeTracks, renameFiles, readTracks, listDir, childFlags: vi.fn().mockResolvedValue({}) },
  });

  __setStateForTest({
    currentDir: 'C:/Music',
    tracks,
    selectedPaths: tracks.map((t) => t.path),
    touched: {},
    pendingArtwork: null,
    renamePrefix: '',
    renamePromptOpen: false,
    undoStack: [],
    status: '',
  });
});

describe('保存したときの履歴', () => {
  it('保存すると履歴が1つ積まれる', async () => {
    actions.setField('album', '新');
    await actions.save();

    expect(__getStateForTest().undoStack).toHaveLength(1);
  });

  it('変更前の値を持つ', async () => {
    actions.setField('album', '新');
    await actions.save();

    const entry = __getStateForTest().undoStack[0];
    expect(entry).toEqual({
      kind: 'tags',
      edits: [
        { path: 'C:/Music/1.flac', changes: { album: '旧A' } },
        { path: 'C:/Music/2.flac', changes: { album: '旧B' } },
      ],
    });
  });

  it('何も書かなければ履歴は増えない', async () => {
    await actions.save();
    expect(__getStateForTest().undoStack).toHaveLength(0);
  });

  it('書き込みに失敗した曲は履歴に入れない', async () => {
    writeTracks.mockResolvedValue([
      { path: 'C:/Music/1.flac', ok: true },
      { path: 'C:/Music/2.flac', ok: false, reason: 'locked', message: '使用中' },
    ]);

    actions.setField('album', '新');
    await actions.save();

    const entry = __getStateForTest().undoStack[0];
    expect(entry.kind === 'tags' && entry.edits).toHaveLength(1);
    expect(entry.kind === 'tags' && entry.edits[0].path).toBe('C:/Music/1.flac');
  });
});

describe('undo', () => {
  it('変更前の値で書き戻す', async () => {
    actions.setField('album', '新');
    await actions.save();
    writeTracks.mockClear();

    await actions.undo();

    expect(writeTracks).toHaveBeenCalledWith([
      { path: 'C:/Music/1.flac', changes: { album: '旧A' } },
      { path: 'C:/Music/2.flac', changes: { album: '旧B' } },
    ]);
  });

  it('取り消したエントリは履歴から消える', async () => {
    actions.setField('album', '新');
    await actions.save();
    await actions.undo();

    expect(__getStateForTest().undoStack).toHaveLength(0);
  });

  it('履歴が空なら何もしない', async () => {
    writeTracks.mockClear();
    await actions.undo();

    expect(writeTracks).not.toHaveBeenCalled();
  });

  it('新しい順に戻す', async () => {
    actions.setField('album', '1回目');
    await actions.save();
    actions.setField('album', '2回目');
    await actions.save();

    expect(__getStateForTest().undoStack).toHaveLength(2);

    writeTracks.mockClear();
    await actions.undo();

    const restored = writeTracks.mock.calls[0][0];
    expect(restored).toHaveLength(2);
    expect(__getStateForTest().undoStack).toHaveLength(1);
  });

  it('取り消しに失敗してもエントリは取り除く', async () => {
    actions.setField('album', '新');
    await actions.save();

    writeTracks.mockResolvedValue([
      { path: 'C:/Music/1.flac', ok: false, reason: 'unknown', message: '消えている' },
      { path: 'C:/Music/2.flac', ok: false, reason: 'unknown', message: '消えている' },
    ]);
    await actions.undo();

    expect(__getStateForTest().undoStack).toHaveLength(0);
  });
});

describe('リネームの履歴', () => {
  it('リネームすると履歴が積まれ、取り消しで元の名前に戻す', async () => {
    renameFiles.mockResolvedValue([{ path: 'C:/Music/label - 01.flac', ok: true }]);
    __setStateForTest({
      tracks: [track('C:/Music/label - 01.flac', 'A')],
      renamePrefix: 'label - ',
      renamePromptOpen: true,
      undoStack: [],
    });

    await actions.confirmRename();
    expect(__getStateForTest().undoStack).toHaveLength(1);

    renameFiles.mockClear();
    await actions.undo();

    expect(renameFiles).toHaveBeenCalledWith([
      { path: 'C:/Music/01.flac', newName: 'label - 01.flac' },
    ]);
  });
});
