import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { ByteVector, File, Picture, PictureType } from 'node-taglib-sharp';
import { classifyWriteError } from './errors';
import type { WriteResult } from '../../shared/types';

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export function imageMimeType(imagePath: string): string {
  return MIME_BY_EXTENSION[extname(imagePath).toLowerCase()] ?? 'application/octet-stream';
}

export function applyArtwork(paths: string[], imagePath: string): WriteResult[] {
  const bytes = readFileSync(imagePath);
  const mimeType = imageMimeType(imagePath);
  const description = basename(imagePath);

  return paths.map((path) => {
    let file: File | undefined;
    try {
      file = File.createFromPath(path);
      const picture = Picture.fromFullData(
        ByteVector.fromByteArray(bytes),
        PictureType.FrontCover,
        mimeType,
        description,
      );
      file.tag.pictures = [picture];
      file.save();
      return { path, ok: true };
    } catch (error) {
      const { reason, message } = classifyWriteError(error);
      return { path, ok: false, reason, message };
    } finally {
      file?.dispose();
    }
  });
}
