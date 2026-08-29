export type TrackTags = {
  path: string;
  fileName: string;
  durationSec: number;
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  trackNumber: number | null;
  trackCount: number | null;
  discNumber: number | null;
  discCount: number | null;
  year: number | null;
  genre: string;
  hasArtwork: boolean;
  /** 量子化ビット数。取得できない場合は 0 */
  bitDepth: number;
  /** サンプリング周波数(Hz)。取得できない場合は 0 */
  sampleRate: number;
};

export type EditableTagFields = Omit<
  TrackTags,
  'path' | 'fileName' | 'durationSec' | 'hasArtwork' | 'bitDepth' | 'sampleRate'
>;

export type TagEdit = {
  path: string;
  changes: Partial<EditableTagFields>;
};

export type WriteFailureReason = 'locked' | 'readonly' | 'unsupported' | 'unknown';

export type WriteResult =
  | { path: string; ok: true }
  | { path: string; ok: false; reason: WriteFailureReason; message: string };

export type DirListing = {
  dirs: string[];
  audioFiles: string[];
  imageFiles: string[];
};

export type ReadResult = {
  tracks: TrackTags[];
  failures: { path: string; message: string }[];
};

export const MULTI_VALUE_SEPARATOR = '; ';
