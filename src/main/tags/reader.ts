import { basename } from 'node:path';
import { File } from 'node-taglib-sharp';
import { MULTI_VALUE_SEPARATOR, type ReadResult, type TrackTags } from '../../shared/types';

function joinValues(values: string[] | undefined): string {
  return (values ?? []).filter((value) => value.length > 0).join(MULTI_VALUE_SEPARATOR);
}

function zeroToNull(value: number | undefined): number | null {
  return value ? value : null;
}

/**
 * 量子化ビット数。FLAC や WAV は properties.bitsPerSample から取れるが、
 * MP4（ALAC / AAC）は 0 が返るため、コーデック側の audioSampleSize を見る。
 */
function readBitDepth(properties: { bitsPerSample: number; codecs?: unknown[] }): number {
  if (properties.bitsPerSample > 0) return properties.bitsPerSample;

  for (const codec of properties.codecs ?? []) {
    const size = (codec as { audioSampleSize?: number } | undefined)?.audioSampleSize;
    if (typeof size === 'number' && size > 0) return size;
  }

  return 0;
}

export function readTrackTags(filePath: string): TrackTags {
  const file = File.createFromPath(filePath);
  try {
    const tag = file.tag;
    return {
      path: filePath,
      fileName: basename(filePath),
      durationSec: Math.round(file.properties.durationMilliseconds / 1000),
      title: tag.title ?? '',
      artist: joinValues(tag.performers),
      album: tag.album ?? '',
      albumArtist: joinValues(tag.albumArtists),
      trackNumber: zeroToNull(tag.track),
      trackCount: zeroToNull(tag.trackCount),
      discNumber: zeroToNull(tag.disc),
      discCount: zeroToNull(tag.discCount),
      year: zeroToNull(tag.year),
      genre: joinValues(tag.genres),
      hasArtwork: (tag.pictures ?? []).length > 0,
      bitDepth: readBitDepth(file.properties),
      sampleRate: file.properties.audioSampleRate ?? 0,
    };
  } finally {
    file.dispose();
  }
}

export function readTracks(paths: string[]): ReadResult {
  const tracks: TrackTags[] = [];
  const failures: { path: string; message: string }[] = [];

  for (const path of paths) {
    try {
      tracks.push(readTrackTags(path));
    } catch (error) {
      failures.push({ path, message: error instanceof Error ? error.message : String(error) });
    }
  }

  return { tracks, failures };
}
