// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DirectoryTree } from '../../src/renderer/src/components/DirectoryTree';
import { __setStateForTest } from '../../src/renderer/src/store/appStore';

beforeEach(() => {
  __setStateForTest({
    roots: ['C:/Music'],
    currentDir: 'C:/Music',
    childDirs: { 'C:/Music': ['C:/Music/Album A', 'C:/Music/Album B'] },
    expanded: ['C:/Music'],
    dirHasChildren: {},
    treeQuery: '',
    searchResults: null,
    searchCollapsed: [],
    rootError: null,
  });
});

describe('DirectoryTree', () => {
  it('ルートと展開済みの子フォルダを名前で表示する', () => {
    render(<DirectoryTree />);
    expect(screen.getByText('Music')).toBeDefined();
    expect(screen.getByText('Album A')).toBeDefined();
    expect(screen.getByText('Album B')).toBeDefined();
  });

  it('検索欄を表示する', () => {
    render(<DirectoryTree />);
    expect(screen.getByLabelText('フォルダを検索')).toBeDefined();
  });

  it('検索中は一致したフォルダだけを出す', () => {
    __setStateForTest({
      treeQuery: 'bass',
      searchResults: ['C:/Music/Label A/Compilation One'],
    });
    render(<DirectoryTree />);

    expect(screen.getByText('Compilation One')).toBeDefined();
    expect(screen.queryByText('Album A')).toBeNull();
  });

  it('検索結果もツリーと同じく親フォルダを辿って表示する', () => {
    __setStateForTest({
      treeQuery: 'bass',
      searchResults: ['C:/Music/Label A/Compilation One'],
    });
    render(<DirectoryTree />);

    expect(screen.getByText('Music')).toBeDefined();
    expect(screen.getByText('Label A')).toBeDefined();
    expect(screen.getByText('Compilation One')).toBeDefined();
  });

  it('一致したフォルダと経路のフォルダを見分けられる', () => {
    __setStateForTest({
      treeQuery: 'bass',
      searchResults: ['C:/Music/Label A/Compilation One'],
    });
    const { container } = render(<DirectoryTree />);

    const hits = [...container.querySelectorAll('.tree-name.hit')].map((el) => el.textContent);
    expect(hits).toEqual(['Compilation One']);
  });

  it('一致が無ければその旨を出す', () => {
    __setStateForTest({ treeQuery: 'そんなの', searchResults: [] });
    render(<DirectoryTree />);
    expect(screen.getByText('一致するフォルダがありません')).toBeDefined();
  });

  it('同名のフォルダも別の親の下に並べて見分けられる', () => {
    __setStateForTest({
      treeQuery: 'imagi',
      searchResults: [
        'C:/Music/Label B/Shared Name',
        'C:/Music/Label A/Shared Name',
      ],
    });
    render(<DirectoryTree />);

    expect(screen.getByText('Label B')).toBeDefined();
    expect(screen.getByText('Label A')).toBeDefined();
    expect(screen.getAllByText('Shared Name')).toHaveLength(2);
  });

  it('検索結果でも子を持つフォルダには矢印を出す', () => {
    __setStateForTest({
      treeQuery: 'bass',
      searchResults: ['C:/Music/Label A/Compilation One'],
    });
    render(<DirectoryTree />);

    expect(screen.getByRole('button', { name: 'Music を閉じる' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Label A を閉じる' })).toBeDefined();
  });

  it('検索結果の一致そのものには矢印を出さない', () => {
    __setStateForTest({
      treeQuery: 'bass',
      searchResults: ['C:/Music/Label A/Compilation One'],
    });
    render(<DirectoryTree />);

    expect(screen.queryByRole('button', { name: /Compilation One を(開く|閉じる)/ })).toBeNull();
  });

  it('検索結果の枝を閉じると配下を隠す', () => {
    __setStateForTest({
      treeQuery: 'bass',
      searchResults: ['C:/Music/Label A/Compilation One'],
      searchCollapsed: ['C:/Music/Label A'],
    });
    render(<DirectoryTree />);

    expect(screen.getByRole('button', { name: 'Label A を開く' })).toBeDefined();
    expect(screen.queryByText('Compilation One')).toBeNull();
  });

  it('検索語を消すとツリーに戻る', () => {
    __setStateForTest({ treeQuery: '', searchResults: null });
    render(<DirectoryTree />);
    expect(screen.getByText('Music')).toBeDefined();
  });

  it('ライブラリの場所を選び直すボタンを出す', () => {
    render(<DirectoryTree />);
    expect(screen.getByRole('button', { name: 'フォルダを開く' })).toBeDefined();
  });

  it('開いているフォルダには閉じる操作を出す', () => {
    render(<DirectoryTree />);
    expect(screen.getByRole('button', { name: 'Music を閉じる' })).toBeDefined();
  });

  it('閉じているフォルダには開く操作を出し、子を表示しない', () => {
    __setStateForTest({ expanded: [] });
    render(<DirectoryTree />);
    expect(screen.getByRole('button', { name: 'Music を開く' })).toBeDefined();
    expect(screen.queryByText('Album A')).toBeNull();
  });

  it('子フォルダを持たないフォルダには開閉ボタンを出さない', () => {
    __setStateForTest({
      childDirs: { 'C:/Music': [] },
      expanded: ['C:/Music'],
    });
    render(<DirectoryTree />);
    expect(screen.queryByRole('button', { name: /Music を(開く|閉じる)/ })).toBeNull();
  });

  it('孫の有無が未判明のフォルダには矢印を出さない（後から消えるのを防ぐ）', () => {
    render(<DirectoryTree />);
    expect(screen.queryByRole('button', { name: /Album A を(開く|閉じる)/ })).toBeNull();
  });

  it('孫を持つと判明したフォルダには矢印を出す', () => {
    __setStateForTest({ dirHasChildren: { 'C:/Music/Album A': true } });
    render(<DirectoryTree />);
    expect(screen.getByRole('button', { name: 'Album A を開く' })).toBeDefined();
  });

  it('孫を持たないと判明したフォルダには矢印を出さない', () => {
    __setStateForTest({ dirHasChildren: { 'C:/Music/Album A': false } });
    render(<DirectoryTree />);
    expect(screen.queryByRole('button', { name: /Album A を(開く|閉じる)/ })).toBeNull();
  });

  it('読み込み済みの子フォルダがあれば、その事実を優先して矢印を出す', () => {
    __setStateForTest({
      childDirs: {
        'C:/Music': ['C:/Music/Album A'],
        'C:/Music/Album A': ['C:/Music/Album A/disc1'],
      },
      dirHasChildren: { 'C:/Music/Album A': false },
    });
    render(<DirectoryTree />);
    expect(screen.getByRole('button', { name: 'Album A を開く' })).toBeDefined();
  });

  it('ルートが開けない場合は左ペインに表示する', () => {
    __setStateForTest({ rootError: 'C:\\Music を開けません: ENOENT' });
    render(<DirectoryTree />);
    expect(screen.getByText(/開けません/)).toBeDefined();
  });
});
