import { existsSync, renameSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { classifyWriteError } from '../tags/errors';
import type { WriteResult } from '../../shared/types';

export type RenameRequest = {
  path: string;
  newName: string;
};

/**
 * ファイル名だけを変更する。フォルダをまたぐ移動はしない。
 * 1件失敗しても止めず、全件分の結果を返す。
 */
export function renameFiles(requests: RenameRequest[]): WriteResult[] {
  return requests.map(({ path, newName }) => {
    try {
      if (newName !== basename(newName) || newName.trim() === '') {
        return {
          path,
          ok: false as const,
          reason: 'unknown' as const,
          message: `使えない名前です: ${newName}`,
        };
      }

      if (basename(path) === newName) return { path, ok: true as const };

      const target = join(dirname(path), newName);
      if (existsSync(target)) {
        return {
          path,
          ok: false as const,
          reason: 'unknown' as const,
          message: `同じ名前のファイルが既にあります: ${newName}`,
        };
      }

      renameSync(path, target);
      return { path, ok: true as const };
    } catch (error) {
      const { reason, message } = classifyWriteError(error);
      return { path, ok: false as const, reason, message };
    }
  });
}
