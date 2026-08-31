import { app, BrowserWindow, Menu, ipcMain, nativeTheme } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc';
import { resolveIconPath } from './iconPath';
import { handleMediaProtocol, registerMediaScheme } from './protocol';

/** styles.css の --surface と --text に合わせる。ズレると帯だけ浮く */
const OVERLAY = {
  light: { color: '#fdfdff', symbolColor: '#2f3540' },
  dark: { color: '#22262f', symbolColor: '#e4e7ef' },
} as const;

function createWindow(): void {
  const startsDark = nativeTheme.shouldUseDarkColors;

  const win = new BrowserWindow({
    width: 1000,
    height: 680,
    // 起動直後の白い一瞬を避けるため、CSS の --bg と同じ色を敷いておく
    backgroundColor: startsDark ? '#1a1d24' : '#f7f8fc',
    icon: resolveIconPath({
      packaged: app.isPackaged,
      mainDir: import.meta.dirname,
      resourcesDir: process.resourcesPath,
    }),
    // OS が描く灰色の帯をやめる。最小化・最大化・閉じるは Windows が描いたまま
    // 残るので、Snap Layouts などの挙動は失われない
    titleBarStyle: 'hidden',
    titleBarOverlay: { ...(startsDark ? OVERLAY.dark : OVERLAY.light), height: 40 },
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // renderer が持っている選択に合わせて塗り替える
  ipcMain.handle('theme:apply', (_event, theme: unknown) => {
    if (theme !== 'light' && theme !== 'dark') return;
    if (win.isDestroyed()) return;
    win.setTitleBarOverlay({ ...OVERLAY[theme], height: 40 });
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
