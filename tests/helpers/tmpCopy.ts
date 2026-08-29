import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const TMP_ROOT = join(process.cwd(), 'tests', 'tmp');
const FIXTURES = join(process.cwd(), 'tests', 'fixtures');

// テストファイルは並列に走るため、ファイルごとに専用のセッションディレクトリを持つ。
// 共有の tests/tmp を消すと、他のファイルが使用中のディレクトリごと巻き添えになる。
const SESSION = join(TMP_ROOT, randomUUID());

export function makeTmpDir(): string {
  const dir = join(SESSION, randomUUID());
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function copyFixture(name: string): string {
  const dest = join(makeTmpDir(), name);
  copyFileSync(join(FIXTURES, name), dest);
  return dest;
}

export function fixturePath(name: string): string {
  return join(FIXTURES, name);
}

export function cleanupTmp(): void {
  rmSync(SESSION, { recursive: true, force: true });
}
