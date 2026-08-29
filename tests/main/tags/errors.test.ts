import { describe, expect, it } from 'vitest';
import { classifyWriteError } from '../../../src/main/tags/errors';

describe('classifyWriteError', () => {
  it('EBUSY を locked に分類し、再生中を疑う文言を返す', () => {
    const error = Object.assign(new Error('busy'), { code: 'EBUSY' });
    const result = classifyWriteError(error);
    expect(result.reason).toBe('locked');
    expect(result.message).toContain('再生中');
  });

  it('EPERM も locked に分類する', () => {
    const error = Object.assign(new Error('perm'), { code: 'EPERM' });
    expect(classifyWriteError(error).reason).toBe('locked');
  });

  it('EACCES を readonly に分類する', () => {
    const error = Object.assign(new Error('acc'), { code: 'EACCES' });
    expect(classifyWriteError(error).reason).toBe('readonly');
  });

  it('未知のエラーは unknown とし、元のメッセージを残す', () => {
    const result = classifyWriteError(new Error('何かが壊れた'));
    expect(result.reason).toBe('unknown');
    expect(result.message).toBe('何かが壊れた');
  });
});
