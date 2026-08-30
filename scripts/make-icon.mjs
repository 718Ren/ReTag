// Logo.tsx と同じ図形から resources/icon.ico を焼く。
// タスクバーは 16〜24px で表示されるので、輪郭ではなく塗りつぶしにしている。
// 下地（角丸の四角）は付けない。他アプリのアイコンと並んだときに浮くため。
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** タグ（荷札）の輪郭。viewBox 0 0 64 64 の座標系 */
const TAG = [
  [9, 13],
  [36, 13],
  [57, 32],
  [36, 51],
  [9, 51],
];
/** 紐通しの穴 [cx, cy, r] */
const HOLE = [18, 32, 3.2];
const ACCENT = [142, 169, 219]; // --accent の #8ea9db

const SIZES = [16, 24, 32, 48, 64, 128, 256];
/** 1ピクセルあたりの分割数。境界をなめらかにするために間引かず数える */
const SUPERSAMPLE = 4;
/** 図形の周りに残す余白の割合 */
const PADDING = 0.1;

function insidePolygon(polygon, x, y) {
  let hit = false;
  for (let i = 0; i < polygon.length; i += 1) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i - 1 + polygon.length) % polygon.length];
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) hit = !hit;
  }
  return hit;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tag, data) {
  const body = Buffer.concat([Buffer.from(tag, 'latin1'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function writePng(pixels, size) {
  // 各行の先頭にフィルタ種別（0 = なし）を置くのが PNG の決まり
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    rows.push(Buffer.from([0]), pixels.subarray(y * size * 4, (y + 1) * size * 4));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // ビット深度
  header[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function render(size) {
  const width = 57 - 9;
  const height = 51 - 13;
  const scale = (size * (1 - PADDING * 2)) / Math.max(width, height);
  const originX = size / 2 - ((9 + 57) / 2) * scale;
  const originY = size / 2 - ((13 + 51) / 2) * scale;

  const pixels = Buffer.alloc(size * size * 4);
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let covered = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          // 図形の座標系に戻してから判定する
          const ux = (px + (sx + 0.5) / SUPERSAMPLE - originX) / scale;
          const uy = (py + (sy + 0.5) / SUPERSAMPLE - originY) / scale;
          const inHole = (ux - HOLE[0]) ** 2 + (uy - HOLE[1]) ** 2 <= HOLE[2] ** 2;
          if (insidePolygon(TAG, ux, uy) && !inHole) covered += 1;
        }
      }
      const at = (py * size + px) * 4;
      pixels[at] = ACCENT[0];
      pixels[at + 1] = ACCENT[1];
      pixels[at + 2] = ACCENT[2];
      pixels[at + 3] = Math.round((covered / samples) * 255);
    }
  }
  return writePng(pixels, size);
}

function writeIco(images, path) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // 1 = アイコン
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  const bodies = [];
  let offset = 6 + 16 * images.length;
  for (const [size, png] of images) {
    const entry = Buffer.alloc(16);
    // 256 は 0 で表す決まり
    entry[0] = size < 256 ? size : 0;
    entry[1] = size < 256 ? size : 0;
    entry.writeUInt16LE(1, 4); // カラープレーン
    entry.writeUInt16LE(32, 6); // ビット深度
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    bodies.push(png);
    offset += png.length;
  }
  writeFileSync(path, Buffer.concat([header, ...entries, ...bodies]));
}

const out = join(process.cwd(), 'resources');
mkdirSync(out, { recursive: true });
writeIco(
  SIZES.map((size) => [size, render(size)]),
  join(out, 'icon.ico'),
);
console.log(`resources/icon.ico を作りました（${SIZES.join(', ')}）`);
