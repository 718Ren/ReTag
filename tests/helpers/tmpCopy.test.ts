import { describe, expect, it, afterAll } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { copyFixture, cleanupTmp } from './tmpCopy';

afterAll(() => cleanupTmp());

describe('copyFixture', () => {
  it('fixture を一時ディレクトリへ複製する', () => {
    const copied = copyFixture('sample.mp3');
    expect(existsSync(copied)).toBe(true);
    expect(statSync(copied).size).toBeGreaterThan(0);
  });

  it('呼ぶたびに別のパスを返す', () => {
    expect(copyFixture('sample.mp3')).not.toBe(copyFixture('sample.mp3'));
  });
});
