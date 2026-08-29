/**
 * ハイレゾ判定。日本オーディオ協会の定義に沿って
 * 「量子化ビット数 24bit 以上」または「サンプリング周波数 88.2kHz 以上」を満たすものとする。
 * 情報が取れない（0）場合は通常音源として扱う。
 */
const MIN_HIRES_BIT_DEPTH = 24;
const MIN_HIRES_SAMPLE_RATE = 88200;

export function isHighResolution(bitDepth: number, sampleRate: number): boolean {
  return bitDepth >= MIN_HIRES_BIT_DEPTH || sampleRate >= MIN_HIRES_SAMPLE_RATE;
}

export function formatQuality(bitDepth: number, sampleRate: number): string {
  const parts: string[] = [];
  if (bitDepth > 0) parts.push(`${bitDepth}bit`);
  if (sampleRate > 0) {
    const kHz = sampleRate / 1000;
    parts.push(`${Number.isInteger(kHz) ? kHz : kHz.toFixed(1)}kHz`);
  }
  return parts.join(' / ');
}
