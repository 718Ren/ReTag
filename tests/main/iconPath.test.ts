import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { resolveIconPath } from '../../src/main/iconPath';

describe('resolveIconPath', () => {
  it('開発中はリポジトリの resources を見る', () => {
    const path = resolveIconPath({
      packaged: false,
      mainDir: 'C:/app/out/main',
      resourcesDir: 'C:/ignored',
    });
    expect(path).toBe(join('C:/app', 'resources', 'icon.ico'));
  });

  it('パッケージ後は同梱された resources を見る', () => {
    const path = resolveIconPath({
      packaged: true,
      mainDir: 'C:/Program Files/ReTag/resources/app.asar/out/main',
      resourcesDir: 'C:/Program Files/ReTag/resources',
    });
    expect(path).toBe(join('C:/Program Files/ReTag/resources', 'icon.ico'));
  });
});
