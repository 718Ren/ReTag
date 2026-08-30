import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXPECTED_SIZES = [16, 24, 32, 48, 64, 128, 256];

/** ICO の目録を読む。scripts/make-icon.mjs が壊れたまま気づかない事故を防ぐ */
function readEntries(ico: Buffer): { size: number; isPng: boolean }[] {
  const count = ico.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => {
    const at = 6 + 16 * i;
    const offset = ico.readUInt32LE(at + 12);
    return {
      // 256 は 0 で表す決まり
      size: ico[at] === 0 ? 256 : ico[at],
      isPng: ico.subarray(offset, offset + 8).equals(PNG_MAGIC),
    };
  });
}

describe('resources/icon.ico', () => {
  const ico = readFileSync(join(process.cwd(), 'resources', 'icon.ico'));

  it('アイコンとして読める', () => {
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
  });

  it('タスクバーからスタートメニューまでのサイズを揃えている', () => {
    expect(readEntries(ico).map((entry) => entry.size)).toEqual(EXPECTED_SIZES);
  });

  it('各サイズの中身が PNG になっている', () => {
    expect(readEntries(ico).every((entry) => entry.isPng)).toBe(true);
  });
});
