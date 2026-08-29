import { File, type Tag } from 'node-taglib-sharp';
import { classifyWriteError } from './errors';
import type { EditableTagFields, TagEdit, WriteResult } from '../../shared/types';

function splitValues(value: string): string[] {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function applyChanges(tag: Tag, changes: Partial<EditableTagFields>): void {
  if (changes.title !== undefined) tag.title = changes.title;
  if (changes.album !== undefined) tag.album = changes.album;
  if (changes.artist !== undefined) tag.performers = splitValues(changes.artist);
  if (changes.albumArtist !== undefined) tag.albumArtists = splitValues(changes.albumArtist);
  if (changes.genre !== undefined) tag.genres = splitValues(changes.genre);
  if (changes.trackNumber !== undefined) tag.track = changes.trackNumber ?? 0;
  if (changes.trackCount !== undefined) tag.trackCount = changes.trackCount ?? 0;
  if (changes.discNumber !== undefined) tag.disc = changes.discNumber ?? 0;
  if (changes.discCount !== undefined) tag.discCount = changes.discCount ?? 0;
  if (changes.year !== undefined) tag.year = changes.year ?? 0;
}

export function writeTrackTags(edit: TagEdit): WriteResult {
  let file: File | undefined;
  try {
    file = File.createFromPath(edit.path);
    applyChanges(file.tag, edit.changes);
    file.save();
    return { path: edit.path, ok: true };
  } catch (error) {
    const { reason, message } = classifyWriteError(error);
    return { path: edit.path, ok: false, reason, message };
  } finally {
    file?.dispose();
  }
}

export function writeTracks(edits: TagEdit[]): WriteResult[] {
  return edits.map((edit) => writeTrackTags(edit));
}
