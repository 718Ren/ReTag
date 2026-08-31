import { join } from 'node:path';

type Location = {
  /** app.isPackaged */
  packaged: boolean;
  /** out/main の場所（import.meta.dirname） */
  mainDir: string;
  /** process.resourcesPath */
  resourcesDir: string;
};

/**
 * ウィンドウアイコンの場所。
 * 開発中は out/main から2つ上がリポジトリの根なので、そこの resources を見る。
 * パッケージ後は out/ が asar の中に入るため、同じ相対では辿れない。
 * electron-builder の extraResources で asar の外に置いたものを見る。
 */
export function resolveIconPath({ packaged, mainDir, resourcesDir }: Location): string {
  return packaged
    ? join(resourcesDir, 'icon.ico')
    : join(mainDir, '..', '..', 'resources', 'icon.ico');
}
