// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagForm } from '../../src/renderer/src/components/TagForm';
import { actions, __setStateForTest } from '../../src/renderer/src/store/appStore';
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

describe('TagForm', () => {
  beforeEach(() => {
    __setStateForTest({ touched: {}, status: '', imageFiles: [], selectedImage: null });
  });

  it('単一選択では現在の値を入力欄に出す', () => {
    __setStateForTest({
      tracks: [track({ path: 'C:/m/1.mp3', title: '一曲目', album: 'Album X' })],
      selectedPaths: ['C:/m/1.mp3'],
    });

    render(<TagForm />);
    expect(screen.getByLabelText<HTMLInputElement>('Title').value).toBe('一曲目');
    expect(screen.getByLabelText<HTMLInputElement>('Album').value).toBe('Album X');
  });

  it('複数選択で値が割れるフィールドはプレースホルダを出す', () => {
    __setStateForTest({
      tracks: [
        track({ path: 'C:/m/1.mp3', title: 'A', album: 'Album X' }),
        track({ path: 'C:/m/2.mp3', title: 'B', album: 'Album X' }),
      ],
      selectedPaths: ['C:/m/1.mp3', 'C:/m/2.mp3'],
    });

    render(<TagForm />);
    const title = screen.getByLabelText<HTMLInputElement>('Title');
    expect(title.value).toBe('');
    expect(title.placeholder).toBe('<複数の値>');
    expect(screen.getByLabelText<HTMLInputElement>('Album').value).toBe('Album X');
  });

  it('選択が空でも入力欄は描画する（高さを変えないため）', () => {
    __setStateForTest({ tracks: [], selectedPaths: [] });
    render(<TagForm />);
    expect(screen.getByText('曲を選んでください')).toBeDefined();
    expect(screen.getByLabelText<HTMLInputElement>('Title')).toBeDefined();
  });

  it('選択が空なら入力欄を操作できない', () => {
    __setStateForTest({ tracks: [], selectedPaths: [] });
    render(<TagForm />);
    expect(screen.getByLabelText<HTMLInputElement>('Title').disabled).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>('Track#').disabled).toBe(true);
  });

  it('曲を選べば入力欄を操作できる', () => {
    __setStateForTest({
      tracks: [track({ path: 'C:/m/1.mp3' })],
      selectedPaths: ['C:/m/1.mp3'],
    });
    render(<TagForm />);
    expect(screen.getByLabelText<HTMLInputElement>('Title').disabled).toBe(false);
  });

  it('数値欄は Disc を左、Track を右に並べる', () => {
    __setStateForTest({
      tracks: [track({ path: 'C:/m/1.mp3' })],
      selectedPaths: ['C:/m/1.mp3'],
    });
    const { container } = render(<TagForm />);
    const labels = [...container.querySelectorAll('.number-label')].map((el) => el.textContent);
    expect(labels).toEqual(['Disc', 'Track', 'Year']);
  });

  it('選択曲数と保存ボタンを表示する', () => {
    __setStateForTest({
      tracks: [track({ path: 'C:/m/1.mp3' }), track({ path: 'C:/m/2.mp3' })],
      selectedPaths: ['C:/m/1.mp3', 'C:/m/2.mp3'],
    });

    render(<TagForm />);
    expect(screen.getByText('2曲を編集中')).toBeDefined();
    expect(screen.getByRole('button', { name: '保存' })).toBeDefined();
    expect(screen.queryByRole('button', { name: /Ctrl/ })).toBeNull();
  });

  it('保存ボタンと選択件数を Genre と同じ行に置く', () => {
    __setStateForTest({
      tracks: [track({ path: 'C:/m/1.mp3' })],
      selectedPaths: ['C:/m/1.mp3'],
    });

    const { container } = render(<TagForm />);
    const genreRow = container.querySelector('.genre-row')!;
    const save = screen.getByRole('button', { name: '保存' });

    expect(genreRow.contains(screen.getByLabelText('Genre'))).toBe(true);
    expect(genreRow.contains(save)).toBe(true);
    expect(genreRow.textContent).toContain('1曲を編集中');
  });

  it('Ctrl+Z で取り消しを呼ぶ', () => {
    const undo = vi.fn();
    const original = actions.undo;
    actions.undo = undo;

    render(<TagForm />);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

    expect(undo).toHaveBeenCalled();
    actions.undo = original;
  });

  it('入力欄の中では取り消しを呼ばない（文字入力の取り消しを優先する）', () => {
    __setStateForTest({
      tracks: [track({ path: 'C:/m/1.mp3' })],
      selectedPaths: ['C:/m/1.mp3'],
    });

    const undo = vi.fn();
    const original = actions.undo;
    actions.undo = undo;

    render(<TagForm />);
    fireEvent.keyDown(screen.getByLabelText('Title'), { key: 'z', ctrlKey: true });

    expect(undo).not.toHaveBeenCalled();
    actions.undo = original;
  });
});
