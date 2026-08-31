import { app, BrowserWindow, Menu } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc';
import { resolveIconPath } from './iconPath';
import { handleMediaProtocol, registerMediaScheme } from './protocol';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1000,
    height: 680,
    // 起動直後の白い一瞬を避けるため、CSS の --bg と同じ色を敷いておく
    backgroundColor: '#1a1d24',
    icon: resolveIconPath({
      packaged: app.isPackaged,
      mainDir: import.meta.dirname,
      resourcesDir: process.resourcesPath,
    }),
    // OS が描く灰色の帯をやめる。最小化・最大化・閉じるは Windows が描いたまま
    // 残るので、Snap Layouts などの挙動は失われない
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#22262f',
      symbolColor: '#e4e7ef',
      height: 40,
    },
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(import.meta.dirname, '../renderer/index.html'));
  }
}

// File / Edit / View のメニューは使っていないので出さない
Menu.setApplicationMenu(null);

registerMediaScheme();

void app.whenReady().then(() => {
  handleMediaProtocol();
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
