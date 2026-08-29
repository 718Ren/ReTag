import type { WriteFailureReason } from '../../shared/types';

export function classifyWriteError(error: unknown): { reason: WriteFailureReason; message: string } {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;

  if (code === 'EBUSY' || code === 'EPERM') {
    return { reason: 'locked', message: '他のアプリが使用中です（再生中ではありませんか？）' };
  }
  if (code === 'EACCES' || code === 'EROFS') {
    return { reason: 'readonly', message: '書き込み権限がありません' };
  }

  const message = error instanceof Error ? error.message : String(error);
  if (/unsupported|not supported|unable to resolve/i.test(message)) {
    return { reason: 'unsupported', message: '対応していない形式です' };
  }

  return { reason: 'unknown', message };
}
