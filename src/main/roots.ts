import { isAbsolute, relative, resolve } from 'node:path';

let roots: string[] = [];

export function resetRoots(): void {
  roots = [];
}

export function getRoots(): string[] {
  return [...roots];
}

export function addRoot(root: string): void {
  roots = [root, ...roots.filter((existing) => existing !== root)];
}

export function isWithinRoots(target: string, allowedRoots: string[]): boolean {
  const resolvedTarget = resolve(target);

  return allowedRoots.some((root) => {
    const relativePath = relative(resolve(root), resolvedTarget);
    return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
  });
}
