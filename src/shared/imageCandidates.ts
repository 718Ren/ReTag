import { compareNatural } from './naturalSort';

const IMAGE_NAME_PRIORITY = ['cover', 'folder', 'front', 'album'];

function baseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] ?? filePath;
}

export function pickPreferredImage(imageFiles: string[]): string | null {
  if (imageFiles.length === 0) return null;

  for (const prefix of IMAGE_NAME_PRIORITY) {
    const match = imageFiles.find((file) => baseName(file).toLowerCase().startsWith(prefix));
    if (match) return match;
  }

  return [...imageFiles].sort(compareNatural)[0];
}
