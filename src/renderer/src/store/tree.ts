import { compareNatural } from '../../../shared/naturalSort';

/**
 * ツリーの開閉状態。フォルダの「選択（曲を読む）」とは独立させる。
 * 両者が同じ操作だと一度開いたフォルダを閉じられなくなる。
 */
export function isExpanded(expanded: string[], dir: string): boolean {
  return expanded.includes(dir);
}

export function toggleExpanded(expanded: string[], dir: string): string[] {
  return isExpanded(expanded, dir)
    ? expanded.filter((open) => open !== dir)
    : [...expanded, dir];
}

/**
 * フォルダ名をクリックしたときの動作。
 * 移動のつもりで押したフォルダが畳まれると邪魔なので、閉じるのは
 * すでに選択中で開いているフォルダを押し直したときだけにする。
 */
export function nameClickAction(
  dir: string,
  state: { currentDir: string | null; expanded: string[] },
): 'select' | 'collapse' {
  return state.currentDir === dir && isExpanded(state.expanded, dir) ? 'collapse' : 'select';
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function isAncestorOf(candidate: string, dir: string): boolean {
  // 「album」と「album2」を取り違えないよう、区切り文字まで含めて比較する
  return normalizePath(dir).startsWith(`${normalizePath(candidate)}/`);
}

/**
 * 開いている枝を1系統だけに保つ。開いたフォルダの先祖は残す。
 * 先祖まで閉じると、開いたはずのフォルダ自身が画面から消えてしまう。
 */
export function expandExclusive(expanded: string[], dir: string): string[] {
  return [...expanded.filter((open) => isAncestorOf(open, dir)), dir];
}

/**
 * 検索結果を、ルートからの親子関係つきで組み立てる。
 * 一致したフォルダだけ並べると「どのフォルダの中にあるのか」が分からないため、
 * 通常のツリーと同じ見え方になるよう親をすべてたどる。
 */
export function buildSearchTree(root: string, matches: string[]): Record<string, string[]> {
  const children = new Map<string, Set<string>>();

  for (const match of matches) {
    if (!normalizePath(match).startsWith(`${normalizePath(root)}/`)) continue;

    const separator = match.charAt(root.length);
    const parts = match
      .slice(root.length + 1)
      .split(/[\\/]/)
      .filter((part) => part.length > 0);

    let parent = root;
    for (const part of parts) {
      const child = `${parent}${separator}${part}`;
      const bucket = children.get(parent) ?? new Set<string>();
      bucket.add(child);
      children.set(parent, bucket);
      parent = child;
    }
  }

  const tree: Record<string, string[]> = {};
  for (const [parent, bucket] of children) {
    tree[parent] = [...bucket].sort(compareNatural);
  }
  return tree;
}

/** フォルダ自身の名前への部分一致で絞る。大文字小文字は区別しない */
export function filterDirs(dirs: string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return dirs;

  return dirs.filter((dir) => {
    const name = dir.split(/[\\/]/).filter(Boolean).pop() ?? dir;
    return name.toLowerCase().includes(needle);
  });
}
