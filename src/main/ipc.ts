import { app, dialog, ipcMain } from 'electron';
import { join } from 'node:path';
import { z } from 'zod';
import { childFlags, listDirectory } from './fs/directory';
import { renameFiles } from './fs/rename';
import { searchDirectories } from './fs/search';
import { readTracks } from './tags/reader';
import { writeTracks } from './tags/writer';
import { applyArtwork } from './tags/artwork';
import { addRoot, getRoots, isWithinRoots } from './roots';
import { loadRoot, saveRoot } from './settings';
import { SETTINGS_FILE } from '../shared/config';
import type { TagEdit } from '../shared/types';

const pathSchema = z.string().min(1);
const pathsSchema = z.array(pathSchema).min(1);

const editsSchema = z.array(
  z.object({
    path: pathSchema,
    changes: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
  }),
);

const searchSchema = z.object({ root: pathSchema, query: z.string() });

const renameSchema = z.array(
  z.object({ path: pathSchema, newName: z.string().min(1) }),
);

const artSchema = z.object({ paths: pathsSchema, imagePath: pathSchema });

function assertAllowed(paths: string[]): void {
  const allowed = getRoots();
  for (const path of paths) {
    if (!isWithinRoots(path, allowed)) {
      throw new Error(`許可されていないパスです: ${path}`);
    }
  }
}

function settingsPath(): string {
  return join(app.getPath('userData'), SETTINGS_FILE);
}

export function registerIpcHandlers(): void {
  // 初回は OS の「ミュージック」フォルダから始め、選び直したら覚えておく
  addRoot(loadRoot(settingsPath(), app.getPath('music')));

  ipcMain.handle('roots:recent', () => getRoots());

  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;

    const root = result.filePaths[0];
    addRoot(root);
    saveRoot(settingsPath(), root);
    return root;
  });

  ipcMain.handle('dialog:openImage', async (_event, rawDefaultPath: unknown) => {
    // 今開いているフォルダから始める。指定が無い・ルート外ならダイアログ任せ
    const parsed = z.string().min(1).safeParse(rawDefaultPath);
    const defaultPath =
      parsed.success && isWithinRoots(parsed.data, getRoots()) ? parsed.data : undefined;

    const result = await dialog.showOpenDialog({
      defaultPath,
      properties: ['openFile'],
      filters: [{ name: '画像', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });

  ipcMain.handle('dir:list', (_event, rawPath: unknown) => {
    const path = pathSchema.parse(rawPath);
    assertAllowed([path]);
    return listDirectory(path);
  });

  ipcMain.handle('dir:childFlags', (_event, rawPaths: unknown) => {
    const paths = pathsSchema.parse(rawPaths);
    assertAllowed(paths);
    return childFlags(paths);
  });

  ipcMain.handle('dir:search', (_event, rawInput: unknown) => {
    const { root, query } = searchSchema.parse(rawInput);
    assertAllowed([root]);
    return searchDirectories(root, query);
  });

  ipcMain.handle('tracks:read', (_event, rawPaths: unknown) => {
    const paths = pathsSchema.parse(rawPaths);
    assertAllowed(paths);
    return readTracks(paths);
  });

  ipcMain.handle('tracks:write', (_event, rawEdits: unknown) => {
    const edits = editsSchema.parse(rawEdits);
    assertAllowed(edits.map((edit) => edit.path));
    return writeTracks(edits as TagEdit[]);
  });

  ipcMain.handle('files:rename', (_event, rawRequests: unknown) => {
    const requests = renameSchema.parse(rawRequests);
    assertAllowed(requests.map((request) => request.path));
    return renameFiles(requests);
  });

  ipcMain.handle('art:apply', (_event, rawInput: unknown) => {
    const { paths, imagePath } = artSchema.parse(rawInput);
    assertAllowed(paths);
    return applyArtwork(paths, imagePath);
  });
}
