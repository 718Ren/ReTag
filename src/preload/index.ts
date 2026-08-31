import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { DirListing, ReadResult, TagEdit, WriteResult } from '../shared/types';

const api = {
  openImage: (defaultPath?: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openImage', defaultPath),
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),
  recentRoots: (): Promise<string[]> => ipcRenderer.invoke('roots:recent'),
  listDir: (path: string): Promise<DirListing> => ipcRenderer.invoke('dir:list', path),
  childFlags: (paths: string[]): Promise<Record<string, boolean>> =>
    ipcRenderer.invoke('dir:childFlags', paths),
  searchDirs: (root: string, query: string): Promise<string[]> =>
    ipcRenderer.invoke('dir:search', { root, query }),
  readTracks: (paths: string[]): Promise<ReadResult> => ipcRenderer.invoke('tracks:read', paths),
  writeTracks: (edits: TagEdit[]): Promise<WriteResult[]> => ipcRenderer.invoke('tracks:write', edits),
  renameFiles: (requests: { path: string; newName: string }[]): Promise<WriteResult[]> =>
    ipcRenderer.invoke('files:rename', requests),
  applyArtwork: (paths: string[], imagePath: string): Promise<WriteResult[]> =>
    ipcRenderer.invoke('art:apply', { paths, imagePath }),
  // タイトルバーのボタンは Windows が描くので、色は main 側で塗り替えてもらう
  applyTheme: (theme: 'light' | 'dark'): Promise<void> => ipcRenderer.invoke('theme:apply', theme),
  // Electron 32 以降 renderer の File.path は削除されている。実パスはここでしか取れない
  getDroppedFilePath: (file: File): string => webUtils.getPathForFile(file),
};

contextBridge.exposeInMainWorld('api', api);

export type RendererApi = typeof api;
