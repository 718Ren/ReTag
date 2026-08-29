import { describe, expect, it } from 'vitest';
import {
  applyPrefixRemoval,
  detectRemovablePrefix,
  startsWithTrackNumber,
} from '../../src/shared/rename';

describe('startsWithTrackNumber', () => {
  it('数字で始まる名前を真とする', () => {
    expect(startsWithTrackNumber('01 Artist Two - Track Two.m4a')).toBe(true);
  });

  it('数字で始まらない名前を偽とする', () => {
    expect(startsWithTrackNumber('Label A - Compilation One - 01 Artist Two.m4a')).toBe(false);
  });

  it('全角数字は数字として扱わない', () => {
    expect(startsWithTrackNumber('０１ Artist Two.m4a')).toBe(false);
  });
});

describe('detectRemovablePrefix', () => {
  const prefixed = [
    'Label A - Compilation One - 01 Artist Two - Track Two.m4a',
    'Label A - Compilation One - 02 Artist Three - Track Three.m4a',
    'Label A - Compilation One - 03 Artist Four - Track Four.m4a',
  ];

  it('全ファイルに共通する先頭部分を返す', () => {
    expect(detectRemovablePrefix(prefixed)).toBe('Label A - Compilation One - ');
  });

  it('削ると番号始まりになることを判定できる', () => {
    const prefix = detectRemovablePrefix(prefixed);
    expect(startsWithTrackNumber(prefixed[0].slice(prefix.length))).toBe(true);
  });

  it('すでに全ファイルが番号始まりなら何も提案しない', () => {
    expect(
      detectRemovablePrefix(['01 Artist Five - Track Five.flac', '02 Artist Six - Track Six.flac']),
    ).toBe('');
  });

  it('アルバム名に数字が含まれていても、その数字は残す', () => {
    expect(
      detectRemovablePrefix([
        'Compilation Two - 01 Artist Two.m4a',
        'Compilation Two - 02 Artist Three.m4a',
      ]),
    ).toBe('Compilation Two - ');
  });

  it('共通部分が無ければ空を返す', () => {
    expect(detectRemovablePrefix(['alpha.mp3', 'beta.mp3'])).toBe('');
  });

  it('ファイルが1つだけなら提案しない（共通部分を決められない）', () => {
    expect(detectRemovablePrefix(['Label A - Compilation One - 01 Artist Two.m4a'])).toBe('');
  });

  it('空配列なら空を返す', () => {
    expect(detectRemovablePrefix([])).toBe('');
  });
});

describe('applyPrefixRemoval', () => {
  it('先頭が一致するファイルだけ削る', () => {
    expect(applyPrefixRemoval('a - 01.mp3', 'a - ')).toBe('01.mp3');
  });

  it('一致しないファイルはそのまま', () => {
    expect(applyPrefixRemoval('b - 01.mp3', 'a - ')).toBe('b - 01.mp3');
  });

  it('空の接頭辞なら何もしない', () => {
    expect(applyPrefixRemoval('a - 01.mp3', '')).toBe('a - 01.mp3');
  });

  it('名前が空になる指定は元の名前を返す', () => {
    expect(applyPrefixRemoval('01.mp3', '01.mp3')).toBe('01.mp3');
  });

  it('拡張子だけになる指定も元の名前を返す', () => {
    expect(applyPrefixRemoval('01.mp3', '01')).toBe('01.mp3');
  });
});
