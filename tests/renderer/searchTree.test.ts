import { describe, expect, it } from 'vitest';
import { buildSearchTree } from '../../src/renderer/src/store/tree';

const ROOT = 'C:\\Music';

describe('buildSearchTree', () => {
  it('一致したフォルダまでの親をたどって階層を組み立てる', () => {
    const tree = buildSearchTree(ROOT, ['C:\\Music\\Label A\\Compilation One']);

    expect(tree[ROOT]).toEqual(['C:\\Music\\Label A']);
    expect(tree['C:\\Music\\Label A']).toEqual([
      'C:\\Music\\Label A\\Compilation One',
    ]);
  });

  it('親を共有する一致はまとめる', () => {
    const tree = buildSearchTree(ROOT, [
      'C:\\Music\\Label A\\Compilation One',
      'C:\\Music\\Label A\\Compilation Two',
    ]);

    expect(tree[ROOT]).toEqual(['C:\\Music\\Label A']);
    expect(tree['C:\\Music\\Label A']).toEqual([
      'C:\\Music\\Label A\\Compilation One',
      'C:\\Music\\Label A\\Compilation Two',
    ]);
  });

  it('別の親のものは分けて並べる', () => {
    const tree = buildSearchTree(ROOT, [
      'C:\\Music\\Label A\\Compilation One',
      'C:\\Music\\Label B\\Compilation Two',
    ]);

    expect(tree[ROOT]).toEqual(['C:\\Music\\Label A', 'C:\\Music\\Label B']);
  });

  it('ルート直下の一致も扱える', () => {
    const tree = buildSearchTree(ROOT, ['C:\\Music\\Album Angel']);
    expect(tree[ROOT]).toEqual(['C:\\Music\\Album Angel']);
  });

  it('孫より深い一致も親を全部たどる', () => {
    const tree = buildSearchTree(ROOT, ['C:\\Music\\Label B\\Album Piano\\Disk1']);

    expect(tree[ROOT]).toEqual(['C:\\Music\\Label B']);
    expect(tree['C:\\Music\\Label B']).toEqual(['C:\\Music\\Label B\\Album Piano']);
    expect(tree['C:\\Music\\Label B\\Album Piano']).toEqual([
      'C:\\Music\\Label B\\Album Piano\\Disk1',
    ]);
  });

  it('ルート配下でないパスは無視する', () => {
    expect(buildSearchTree(ROOT, ['C:\\other\\Compilation One'])).toEqual({});
  });

  it('一致が無ければ空を返す', () => {
    expect(buildSearchTree(ROOT, [])).toEqual({});
  });

  it('スラッシュ区切りのパスも扱える', () => {
    const tree = buildSearchTree('C:/Music', ['C:/Music/Label B/Album Angel']);
    expect(tree['C:/Music']).toEqual(['C:/Music/Label B']);
  });
});
