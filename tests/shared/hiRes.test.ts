import { describe, expect, it } from 'vitest';
import { formatQuality, isHighResolution } from '../../src/shared/hiRes';

describe('isHighResolution', () => {
  it('24bit ならハイレゾ（サンプリング周波数が 48kHz でも）', () => {
    expect(isHighResolution(24, 48000)).toBe(true);
  });

  it('96kHz ならハイレゾ', () => {
    expect(isHighResolution(16, 96000)).toBe(true);
  });

  it('88.2kHz もハイレゾ', () => {
    expect(isHighResolution(16, 88200)).toBe(true);
  });

  it('16bit / 44.1kHz は通常', () => {
    expect(isHighResolution(16, 44100)).toBe(false);
  });

  it('16bit / 48kHz は通常', () => {
    expect(isHighResolution(16, 48000)).toBe(false);
  });

  it('情報が取れない場合は通常として扱う', () => {
    expect(isHighResolution(0, 0)).toBe(false);
  });
});

describe('formatQuality', () => {
  it('ビット深度と周波数を並べる', () => {
    expect(formatQuality(24, 96000)).toBe('24bit / 96kHz');
  });

  it('小数になる周波数も表す', () => {
    expect(formatQuality(16, 44100)).toBe('16bit / 44.1kHz');
  });

  it('ビット深度が不明なら周波数だけ出す', () => {
    expect(formatQuality(0, 44100)).toBe('44.1kHz');
  });

  it('どちらも不明なら空を返す', () => {
    expect(formatQuality(0, 0)).toBe('');
  });
});
