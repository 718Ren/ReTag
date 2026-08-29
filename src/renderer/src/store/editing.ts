import type { TagEdit, TrackTags } from '../../../shared/types';

export const MULTIPLE_VALUES = '<複数の値>';

export const EDITABLE_FIELDS = [
  'title',
  'artist',
  'album',
  'albumArtist',
  'trackNumber',
  'trackCount',
  'discNumber',
  'discCount',
  'year',
  'genre',
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

const NUMERIC_FIELDS: EditableField[] = [
  'trackNumber',
  'trackCount',
  'discNumber',
  'discCount',
  'year',
];

export type FormState = {
  values: Record<EditableField, string>;
  mixed: Record<EditableField, boolean>;
};

function displayValue(track: TrackTags, field: EditableField): string {
  const value = track[field];
  if (value === null || value === undefined) return '';
  return String(value);
}

export function commonFieldValues(tracks: TrackTags[]): FormState {
  const values = {} as Record<EditableField, string>;
  const mixed = {} as Record<EditableField, boolean>;

  for (const field of EDITABLE_FIELDS) {
    const distinct = new Set(tracks.map((track) => displayValue(track, field)));
    const isMixed = distinct.size > 1;
    mixed[field] = isMixed;
    values[field] = isMixed ? '' : (distinct.values().next().value ?? '');
  }

  return { values, mixed };
}

export function buildEdits(
  tracks: TrackTags[],
  touched: Partial<Record<EditableField, string>>,
): TagEdit[] {
  const changes: TagEdit['changes'] = {};

  for (const field of EDITABLE_FIELDS) {
    const raw = touched[field];
    if (raw === undefined || raw === MULTIPLE_VALUES) continue;

    // フィールド名が union のままだと代入時に型が絞れないため、書き込み口だけ緩める
    const sink = changes as Record<string, string | number | null>;

    if (NUMERIC_FIELDS.includes(field)) {
      const trimmed = raw.trim();
      sink[field] = trimmed === '' ? null : Number(trimmed);
    } else {
      sink[field] = raw;
    }
  }

  if (Object.keys(changes).length === 0) return [];

  return tracks.map((track) => ({ path: track.path, changes: { ...changes } }));
}
