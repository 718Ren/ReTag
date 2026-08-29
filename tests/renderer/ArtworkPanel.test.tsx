// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArtworkPanel } from '../../src/renderer/src/components/ArtworkPanel';
import { actions, __setStateForTest } from '../../src/renderer/src/store/appStore';

describe('ArtworkPanel', () => {
  beforeEach(() => {
    __setStateForTest({
      imageFiles: [],
      selectedImage: null,
      pendingArtwork: null,
      tracks: [],
    });
  });

  it('画像が1枚ならサムネイルとして表示する', () => {
    __setStateForTest({
      imageFiles: ['C:/m/cover.jpg'],
      selectedImage: 'C:/m/cover.jpg',
    });

    render(<ArtworkPanel />);
    expect(screen.getByAltText('アートワーク候補')).toBeDefined();
  });

  it('適用ボタンは持たない（保存で書き込むため）', () => {
    __setStateForTest({
      imageFiles: ['C:/m/cover.jpg'],
      selectedImage: 'C:/m/cover.jpg',
    });

    render(<ArtworkPanel />);
    expect(screen.queryByRole('button', { name: /適用/ })).toBeNull();
  });

  it('自動検出しただけでは保存対象と表示しない', () => {
    __setStateForTest({
      imageFiles: ['C:/m/cover.jpg'],
      selectedImage: 'C:/m/cover.jpg',
      pendingArtwork: null,
    });

    render(<ArtworkPanel />);
    expect(screen.queryByText(/保存で選択中の曲に適用/)).toBeNull();
  });

  it('選び直した画像は保存対象だと示す', () => {
    __setStateForTest({
      imageFiles: ['C:/m/cover.jpg'],
      selectedImage: 'C:/m/cover.jpg',
      pendingArtwork: 'C:/m/cover.jpg',
    });

    render(<ArtworkPanel />);
    expect(screen.getByText(/保存で選択中の曲に適用/)).toBeDefined();
  });

  it('画像が複数なら選択肢を出す', () => {
    __setStateForTest({
      imageFiles: ['C:/m/cover.jpg', 'C:/m/back.png'],
      selectedImage: 'C:/m/cover.jpg',
    });

    render(<ArtworkPanel />);
    expect(screen.getByRole('button', { name: 'cover.jpg' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'back.png' })).toBeDefined();
  });

  it('選択ダイアログは今開いているフォルダから始める', async () => {
    const openImage = vi.fn().mockResolvedValue(null);
    Object.defineProperty(window, 'api', { configurable: true, value: { openImage } });
    __setStateForTest({ currentDir: 'C:/Music/Label B/Album Angel' });

    await actions.pickImage();

    expect(openImage).toHaveBeenCalledWith('C:/Music/Label B/Album Angel');
  });

  it('画像枠を押すと選択ダイアログを開ける', () => {
    render(<ArtworkPanel />);
    expect(screen.getByRole('button', { name: /画像を選ぶ/ })).toBeDefined();
  });

  it('画像がなければ D&D の案内を出す', () => {
    render(<ArtworkPanel />);
    expect(screen.getByText('クリックで選択またはドロップ')).toBeDefined();
  });
});
