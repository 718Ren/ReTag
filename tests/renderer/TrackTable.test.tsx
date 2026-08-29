// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackTable } from '../../src/renderer/src/components/TrackTable';
import { __setStateForTest } from '../../src/renderer/src/store/appStore';
import type { TrackTags } from '../../src/shared/types';

function track(overrides: Partial<TrackTags>): TrackTags {
  return {
    path: 'C:/m/a.mp3',
    fileName: 'a.mp3',
    durationSec: 61,
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

beforeEach(() => {
  __setStateForTest({
    tracks: [
      track({ path: 'C:/m/1.mp3', fileName: '1.mp3', title: '一曲目', trackNumber: 1 }),
      track({ path: 'C:/m/2.mp3', fileName: '2.mp3', title: '二曲目', trackNumber: 2 }),
    ],
    failures: [{ path: 'C:/m/broken.mp3', message: '読み取り失敗' }],
    selectedPaths: [],
    renamePrefix: '',
    status: '',
    layout: { paneWidth: 280, columnWidths: [78, 168, 168, 56] },
  });
});

describe('TrackTable', () => {
  it('トラックを行として表示する', () => {
    render(<TrackTable />);
    expect(screen.getByText('一曲目')).toBeDefined();
    expect(screen.getByText('二曲目')).toBeDefined();
  });

  it('長さを分:秒で表示する', () => {
    render(<TrackTable />);
    expect(screen.getAllByText('1:01').length).toBe(2);
  });

  it('読み取りに失敗したファイルを警告つきで表示する', () => {
    render(<TrackTable />);
    expect(screen.getByText(/broken\.mp3/)).toBeDefined();
    expect(screen.getByTitle('読み取り失敗')).toBeDefined();
  });

  it('連番ボタンは持たない', () => {
    render(<TrackTable />);
    expect(screen.queryByRole('button', { name: '連番を振る' })).toBeNull();
  });

  it('先頭を削除する入力欄は持たない（プレビューで意図が分かるため）', () => {
    render(<TrackTable />);
    expect(screen.queryByLabelText('先頭を削除')).toBeNull();
  });

  it('列幅を保存された値で描画する', () => {
    render(<TrackTable />);
    expect(screen.getByRole('columnheader', { name: /Track#/ }).style.width).toBe('78px');
  });

  it('Title は幅を指定せず、残りを埋める（右端が見切れないように）', () => {
    render(<TrackTable />);
    expect(screen.getByRole('columnheader', { name: /Title/ }).style.width).toBe('');
  });

  it('幅を変えられる列にはつまみを出す', () => {
    render(<TrackTable />);
    expect(screen.getAllByRole('separator', { name: /の幅を変更/ })).toHaveLength(3);
  });

  it('ハイレゾ音源には HR を出す', () => {
    __setStateForTest({
      tracks: [track({ path: 'E:/m/hi.flac', bitDepth: 24, sampleRate: 96000 })],
    });
    render(<TrackTable />);
    expect(screen.getByTitle('24bit / 96kHz').textContent).toBe('HR');
  });

  it('通常音源には HR を出さない', () => {
    render(<TrackTable />);
    expect(screen.queryByText('HR')).toBeNull();
  });

  it('ファイル名の列は持たない', () => {
    render(<TrackTable />);
    expect(screen.queryByRole('columnheader', { name: /ファイル名/ })).toBeNull();
  });
});
