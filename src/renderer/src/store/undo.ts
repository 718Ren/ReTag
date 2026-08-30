import type { TagEdit, TrackTags } from '../../../shared/types';

export type UndoEntry =
  | { kind: 'tags'; edits: TagEdit[] }
  | { kind: 'rename'; renames: { path: string; newName: string }[] };

/**
 * これから書き込む内容から、元へ戻すための指示を作る。
 * 変更前の値は画面が持っているトラック一覧から取る（ファイルは読み直さない）。
 */
export function buildTagUndo(tracks: TrackTags[], edits: TagEdit[]): TagEdit[] {
  const byPath = new Map(tracks.map((track) => [track.path, track]));

  return edits.flatMap((edit) => {
    const track = byPath.get(edit.path);
    if (!track) return [];

    const changes: TagEdit['changes'] = {};
    const sink = changes as Record<string, string | number | null>;
    const source = track as unknown as Record<string, string | number | null>;

    for (const field of Object.keys(edit.changes)) {
      sink[field] = source[field];
    }

    return [{ path: edit.path, changes }];
  });
}

function directoryOf(path: string): string {
  const index = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
  return index < 0 ? '' : path.slice(0, index + 1);
}

function baseNameOf(path: string): string {
  return path.slice(directoryOf(path).length);
}

/** リネーム後のパスを起点に、元の名前へ戻す指示を作る */
export function buildRenameUndo(
  renames: { path: string; newName: string }[],
): { path: string; newName: string }[] {
  return renames.map((rename) => ({
    path: `${directoryOf(rename.path)}${rename.newName}`,
    newName: baseNameOf(rename.path),
  }));
}
