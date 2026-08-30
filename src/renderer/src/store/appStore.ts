import { useSyncExternalStore } from 'react';
import type { TagEdit, TrackTags, WriteResult } from '../../../shared/types';
import { pickPreferredImage } from '../../../shared/imageCandidates';
import { buildEdits, type EditableField } from './editing';
import { expandExclusive, isExpanded, nameClickAction, toggleExpanded } from './tree';
import { clampColumnWidth, clampPaneWidth, loadLayout, saveLayout, type Layout } from './layout';
import { combineResults } from './saveResults';
import { buildRenameUndo, buildTagUndo, type UndoEntry } from './undo';
import { applyPrefixRemoval, detectRemovablePrefix } from '../../../shared/rename';

export type AppState = {
  roots: string[];
  currentDir: string | null;
  /** 読み込み済みの子フォルダ。閉じても捨てないので開き直しで再読み込みしない */
  childDirs: Record<string, string[]>;
  /** いま開いているフォルダ */
  expanded: string[];
  /** 各フォルダがサブフォルダを持つか。未判明のフォルダは載らない */
  dirHasChildren: Record<string, boolean>;
  /** 左ペインの絞り込み文字列 */
  treeQuery: string;
  /** 検索結果。null なら検索していない（ツリーを出す） */
  searchResults: string[] | null;
  /** 検索結果のうち閉じている枝。既定は全部開いた状態 */
  searchCollapsed: string[];
  tracks: TrackTags[];
  failures: { path: string; message: string }[];
  selectedPaths: string[];
  touched: Partial<Record<EditableField, string>>;
  imageFiles: string[];
  selectedImage: string | null;
  /** 保存時に埋め込む画像。ユーザーが選び直した時だけ入る */
  pendingArtwork: string | null;
  /** ファイル名から削る先頭部分。検出しただけの状態で、実行はポップアップで選ぶ */
  renamePrefix: string;
  renamePromptOpen: boolean;
  layout: Layout;
  /** ルートそのものが開けないときだけ立てる。保存結果の status とは用途が別 */
  rootError: string | null;
  /** 取り消し履歴。新しいものが末尾 */
  undoStack: UndoEntry[];
  status: string;
};

const initialState: AppState = {
  roots: [],
  currentDir: null,
  childDirs: {},
  expanded: [],
  dirHasChildren: {},
  treeQuery: '',
  searchResults: null,
  searchCollapsed: [],
  tracks: [],
  failures: [],
  selectedPaths: [],
  touched: {},
  imageFiles: [],
  selectedImage: null,
  pendingArtwork: null,
  renamePrefix: '',
  renamePromptOpen: false,
  layout: loadLayout(),
  rootError: null,
  undoStack: [],
  status: '',
};

let state: AppState = initialState;
const listeners = new Set<() => void>();

function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}

export function summarize(results: WriteResult[], done = 'を保存しました'): string {
  const failed = results.filter((result) => !result.ok);
  if (failed.length === 0) return `${results.length}件${done}`;

  const first = failed[0];
  const detail = first.ok ? '' : `（${first.path}: ${first.message}）`;
  return `${results.length}件中${failed.length}件失敗${detail}`;
}

export function renameRequests(
  tracks: TrackTags[],
  prefix: string,
): { path: string; newName: string }[] {
  if (prefix === '') return [];

  return tracks
    .map((track) => ({ path: track.path, newName: applyPrefixRemoval(track.fileName, prefix) }))
    .filter((request, index) => request.newName !== tracks[index].fileName);
}

export const actions = {
  async init(): Promise<void> {
    const roots = await window.api.recentRoots();
    setState({ roots });
    if (roots.length > 0) await actions.selectDir(roots[0]);
  },

  /** ライブラリの場所を選び直す */
  async openFolder(): Promise<void> {
    const root = await window.api.openFolder();
    if (!root) return;

    setState({ roots: [root], childDirs: {}, expanded: [], dirHasChildren: {}, treeQuery: '', searchResults: null });
    await actions.selectDir(root);
  },

  /** フォルダ名のクリック。押し直しなら閉じる、それ以外は選択して開く */
  async activateDir(dir: string): Promise<void> {
    if (nameClickAction(dir, { currentDir: state.currentDir, expanded: state.expanded }) === 'collapse') {
      setState({ expanded: toggleExpanded(state.expanded, dir) });
      return;
    }
    await actions.selectDir(dir);
  },

  /** 三角のクリック。開閉だけを切り替え、曲の読み込みはしない */
  async toggleDir(dir: string): Promise<void> {
    if (isExpanded(state.expanded, dir)) {
      setState({ expanded: toggleExpanded(state.expanded, dir) });
      return;
    }

    setState({ expanded: expandExclusive(state.expanded, dir) });
    if (state.childDirs[dir] === undefined) {
      await actions.loadChildren(dir);
    }
  },

  /** 子フォルダが孫を持つかを後から埋める。冷えたキャッシュだと数秒かかるので待たない */
  async loadChildFlags(dirs: string[]): Promise<void> {
    if (dirs.length === 0) return;
    try {
      const flags = await window.api.childFlags(dirs);
      setState({ dirHasChildren: { ...state.dirHasChildren, ...flags } });
    } catch {
      // 三角が出ないだけなので、失敗しても操作は続けられる
    }
  },

  async loadChildren(dir: string): Promise<void> {
    try {
      const listing = await window.api.listDir(dir);
      setState({ childDirs: { ...state.childDirs, [dir]: listing.dirs } });
      void actions.loadChildFlags(listing.dirs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({
        childDirs: { ...state.childDirs, [dir]: [] },
        rootError: `${dir} を開けません: ${message}`,
      });
    }
  },

  async selectDir(dir: string): Promise<void> {
    let listing;
    try {
      listing = await window.api.listDir(dir);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({
        currentDir: dir,
        tracks: [],
        failures: [],
        rootError: `${dir} を開けません: ${message}`,
      });
      return;
    }

    const { tracks, failures } = listing.audioFiles.length
      ? await window.api.readTracks(listing.audioFiles)
      : { tracks: [], failures: [] };

    const detectedPrefix = detectRemovablePrefix(
      listing.audioFiles.map((path) => path.split(/[\\/]/).pop() ?? path),
    );

    setState({
      currentDir: dir,
      childDirs: { ...state.childDirs, [dir]: listing.dirs },
      expanded: expandExclusive(state.expanded, dir),
      tracks,
      failures,
      selectedPaths: [],
      touched: {},
      imageFiles: listing.imageFiles,
      selectedImage: pickPreferredImage(listing.imageFiles),
      pendingArtwork: null,
      renamePrefix: detectedPrefix,
      renamePromptOpen: detectedPrefix !== '',
      rootError: null,
      status: '',
    });

    void actions.loadChildFlags(listing.dirs);
  },

  setPaneWidth(width: number): void {
    const layout = { ...state.layout, paneWidth: clampPaneWidth(width) };
    setState({ layout });
    saveLayout(layout);
  },

  setColumnWidth(index: number, width: number): void {
    const columnWidths = state.layout.columnWidths.map((current, at) =>
      at === index ? clampColumnWidth(width) : current,
    );
    const layout = { ...state.layout, columnWidths };
    setState({ layout });
    saveLayout(layout);
  },

  selectTracks(paths: string[]): void {
    setState({ selectedPaths: paths, touched: {} });
  },

  setField(field: EditableField, value: string): void {
    setState({ touched: { ...state.touched, [field]: value } });
  },

  /** 画像枠のクリック。ファイル選択ダイアログから選ぶ */
  async pickImage(): Promise<void> {
    const imagePath = await window.api.openImage(state.currentDir ?? undefined);
    if (imagePath) actions.selectImage(imagePath);
  },

  selectImage(imagePath: string): void {
    // 自動検出した候補をそのまま書き戻すことはしない。選び直した時だけ適用対象になる
    setState({ selectedImage: imagePath, pendingArtwork: imagePath });
  },

  setTreeQuery(query: string): void {
    setState({ treeQuery: query });
    if (query.trim() === '') setState({ searchResults: null, searchCollapsed: [] });
  },

  /** 階層をまたいでフォルダ名を探す。呼び出し側で入力の落ち着きを待つこと */
  async runSearch(): Promise<void> {
    const query = state.treeQuery.trim();
    const root = state.roots[0];
    if (query === '' || !root) {
      setState({ searchResults: null });
      return;
    }

    try {
      setState({ searchResults: await window.api.searchDirs(root, query), searchCollapsed: [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ searchResults: [], status: `検索に失敗しました: ${message}` });
    }
  },

  toggleSearchNode(dir: string): void {
    setState({ searchCollapsed: toggleExpanded(state.searchCollapsed, dir) });
  },

  /** ポップアップで「削除する」を選んだ時。ここが確認そのものなので即実行する */
  async confirmRename(): Promise<void> {
    const renames = renameRequests(state.tracks, state.renamePrefix);
    setState({ renamePromptOpen: false, renamePrefix: '' });
    if (renames.length === 0) return;

    const results = await window.api.renameFiles(renames);

    const renamedPaths = new Set(results.filter((result) => result.ok).map((result) => result.path));
    const undoRenames = buildRenameUndo(
      renames.filter((rename) => renamedPaths.has(rename.path)),
    );
    if (undoRenames.length > 0) {
      setState({ undoStack: [...state.undoStack, { kind: 'rename', renames: undoRenames }] });
    }

    // selectDir は status を空に戻すので、読み直してから結果を出す
    if (state.currentDir) await actions.selectDir(state.currentDir);
    setState({ status: summarize(results, 'のファイル名を変更しました') });
  },

  dismissRename(): void {
    setState({ renamePromptOpen: false, renamePrefix: '' });
  },

  selectAllTracks(): void {
    setState({ selectedPaths: state.tracks.map((track) => track.path), touched: {} });
  },

  /** 履歴の末尾を取り出して逆操作を実行する。失敗しても履歴からは取り除く */
  async undo(): Promise<void> {
    const entry = state.undoStack[state.undoStack.length - 1];
    if (!entry) return;

    setState({ undoStack: state.undoStack.slice(0, -1) });

    if (entry.kind === 'tags') {
      await window.api.writeTracks(entry.edits);
    } else {
      await window.api.renameFiles(entry.renames);
    }

    if (state.currentDir) await actions.selectDir(state.currentDir);
  },

  async save(): Promise<void> {
    const selected = state.tracks.filter((track) => state.selectedPaths.includes(track.path));
    const edits = buildEdits(selected, state.touched);
    const artworkTargets =
      state.pendingArtwork && selected.length > 0 ? selected.map((track) => track.path) : [];

    if (edits.length === 0 && artworkTargets.length === 0) return;

    const results: WriteResult[] = [];

    if (edits.length > 0) {
      results.push(...(await window.api.writeTracks(edits)));
    }

    if (artworkTargets.length > 0 && state.pendingArtwork) {
      try {
        results.push(...(await window.api.applyArtwork(artworkTargets, state.pendingArtwork)));
      } catch (error) {
        // 画像が読めない場合。適用予定は残して選び直せるようにする
        const message = error instanceof Error ? error.message : String(error);
        setState({ status: `画像を読み込めませんでした: ${message}` });
        return;
      }
    }

    // 書き込めた曲だけを取り消しの対象にする
    const writtenPaths = new Set(results.filter((result) => result.ok).map((result) => result.path));
    const undoEdits = buildTagUndo(
      selected,
      edits.filter((edit) => writtenPaths.has(edit.path)),
    );

    setState({
      status: summarize(combineResults(results)),
      touched: {},
      pendingArtwork: null,
      undoStack:
        undoEdits.length > 0
          ? [...state.undoStack, { kind: 'tags', edits: undoEdits }]
          : state.undoStack,
    });
    await actions.reloadTracks();
  },

  async reloadTracks(): Promise<void> {
    const paths = state.tracks.map((track) => track.path);
    if (paths.length === 0) return;
    const { tracks, failures } = await window.api.readTracks(paths);
    setState({ tracks, failures });
  },


};

export function __setStateForTest(patch: Partial<AppState>): void {
  setState(patch);
}

export function __getStateForTest(): AppState {
  return state;
}
