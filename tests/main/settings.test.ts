import { describe, expect, it, beforeEach, afterAll } from 'vitest';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { loadRoot, saveRoot } from '../../src/main/settings';
import { cleanupTmp, makeTmpDir } from '../helpers/tmpCopy';

const TMP = makeTmpDir();
const FALLBACK = join(TMP, 'Music');

let settingsFile = '';

beforeEach(() => {
  settingsFile = join(makeTmpDir(), 'settings.json');
});

afterAll(() => cleanupTmp());

describe('loadRoot', () => {
  it('保存が無ければ渡された既定値を返す', () => {
    expect(loadRoot(settingsFile, FALLBACK)).toBe(FALLBACK);
  });

  it('保存した場所を読み戻す', () => {
    saveRoot(settingsFile, 'C:/Music/Library');
    expect(loadRoot(settingsFile, FALLBACK)).toBe('C:/Music/Library');
  });

  it('壊れた内容なら既定値に戻る', () => {
    writeFileSync(settingsFile, '{ not json');
    expect(loadRoot(settingsFile, FALLBACK)).toBe(FALLBACK);
  });

  it('root が文字列でなければ既定値に戻る', () => {
    writeFileSync(settingsFile, JSON.stringify({ root: 42 }));
    expect(loadRoot(settingsFile, FALLBACK)).toBe(FALLBACK);
  });
});

describe('saveRoot', () => {
  it('書き込めない場所を渡されても例外を投げない', () => {
    expect(() => saveRoot(join(TMP, 'no-such-dir', 'settings.json'), 'C:/Music')).not.toThrow();
  });
});
