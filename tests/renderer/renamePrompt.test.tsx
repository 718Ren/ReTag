// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RenamePrompt } from '../../src/renderer/src/components/RenamePrompt';
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

const tracks = [track('E:/m/a/x - 01 One.mp3'), track('E:/m/a/x - 02 Two.mp3')];

const renameFiles = vi.fn();
const listDir = vi.fn();
const readTracks = vi.fn();

beforeEach(() => {
  renameFiles.mockReset().mockResolvedValue([
    { path: tracks[0].path, ok: true },
    { path: tracks[1].path, ok: true },
  ]);
  listDir.mockReset().mockResolvedValue({ dirs: [], audioFiles: [], imageFiles: [] });
  readTracks.mockReset().mockResolvedValue({ tracks: [], failures: [] });

  Object.defineProperty(window, 'api', {
    configurable: true,
    value: { renameFiles, listDir, readTracks, childFlags: vi.fn().mockResolvedValue({}) },
  });

  __setStateForTest({
    currentDir: 'E:/m/a',
    tracks,
    renamePrefix: 'x - ',
    renamePromptOpen: true,
    status: '',
  });
});

describe('RenamePrompt', () => {
  it('検出した接頭辞と対象件数を出す', () => {
    const { container } = render(<RenamePrompt />);
    expect(container.querySelector('.modal-prefix')!.textContent).toBe('x - ');
    expect(screen.getByText(/2件/)).toBeDefined();
  });

  it('変更前と変更後の例を出す', () => {
    render(<RenamePrompt />);
    expect(screen.getByText('x - 01 One.mp3')).toBeDefined();
    expect(screen.getByText('01 One.mp3')).toBeDefined();
  });

  it('選択肢を2つ出す', () => {
    render(<RenamePrompt />);
    expect(screen.getByRole('button', { name: '削除する' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'そのままにする' })).toBeDefined();
  });

  it('閉じていれば何も描かない', () => {
    __setStateForTest({ renamePromptOpen: false });
    const { container } = render(<RenamePrompt />);
    expect(container.firstChild).toBeNull();
  });
});

describe('confirmRename', () => {
  it('実際のリネームを依頼する', async () => {
    await actions.confirmRename();

    expect(renameFiles).toHaveBeenCalledWith([
      { path: tracks[0].path, newName: '01 One.mp3' },
      { path: tracks[1].path, newName: '02 Two.mp3' },
    ]);
  });

  it('実行後はポップアップを閉じ、結果を伝える', async () => {
    await actions.confirmRename();

    expect(__getStateForTest().renamePromptOpen).toBe(false);
    expect(__getStateForTest().renamePrefix).toBe('');
    expect(__getStateForTest().status).toContain('2件');
  });
});

describe('dismissRename', () => {
  it('リネームせずに閉じる', () => {
    actions.dismissRename();

    expect(renameFiles).not.toHaveBeenCalled();
    expect(__getStateForTest().renamePromptOpen).toBe(false);
    expect(__getStateForTest().renamePrefix).toBe('');
  });
});
