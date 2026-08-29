import { readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { compareNatural } from '../../shared/naturalSort';
import type { DirListing } from '../../shared/types';

export const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wav'] as const;
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

function hasExtension(fileName: string, extensions: readonly string[]): boolean {
  return extensions.includes(extname(fileName).toLowerCase());
}

export function listDirectory(dirPath: string): DirListing {
  const entries = readdirSync(dirPath, { withFileTypes: true });

  const dirs: string[] = [];
  const audioFiles: string[] = [];
  const imageFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(entry.name);
    } else if (entry.isFile()) {
      if (hasExtension(entry.name, AUDIO_EXTENSIONS)) audioFiles.push(entry.name);
      else if (hasExtension(entry.name, IMAGE_EXTENSIONS)) imageFiles.push(entry.name);
    }
  }

  const toPaths = (names: string[]): string[] =>
    names.sort(compareNatural).map((name) => join(dirPath, name));

  return {
    dirs: toPaths(dirs),
    audioFiles: toPaths(audioFiles),
    imageFiles: toPaths(imageFiles),
  };
}

/**
 * 各フォルダがサブフォルダを持つかどうか。ツリーの開閉三角を出すか決めるために使う。
 * 中身を全部読まずに済むよう、ディレクトリを1つ見つけた時点で打ち切る。
 */
export function hasSubdirectories(dirPath: string): boolean {
  try {
    return readdirSync(dirPath, { withFileTypes: true }).some((entry) => entry.isDirectory());
  } catch {
    // 読めないフォルダは「子なし」として扱う。開こうとした時に改めてエラーを出す
    return false;
  }
}

export function childFlags(paths: string[]): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const path of paths) {
    flags[path] = hasSubdirectories(path);
  }
  return flags;
}
