import { app, BrowserWindow, Menu } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc';
import { handleMediaProtocol, registerMediaScheme } from './protocol';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1000,
    height: 680,
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
