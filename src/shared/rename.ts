/**
 * ファイル名の先頭にある不要な共通部分を削るための判定。
 * 「01 Artist - Title.ext」の形に寄せるのが狙い。
 */

export function startsWithTrackNumber(fileName: string): boolean {
  return /^\d/.test(fileName);
}

function longestCommonPrefix(values: string[]): string {
  if (values.length === 0) return '';

  let prefix = values[0];
  for (const value of values.slice(1)) {
    let length = 0;
    while (length < prefix.length && length < value.length && prefix[length] === value[length]) {
      length++;
    }
    prefix = prefix.slice(0, length);
    if (prefix === '') break;
  }
  return prefix;
}

/**
 * 削る候補の先頭部分。以下の場合は提案しない（空文字を返す）。
 * - すでに全ファイルが番号で始まっている（直す理由がない）
 * - ファイルが1つしかない（何が共通部分か決められない）
 */
export function detectRemovablePrefix(fileNames: string[]): string {
  if (fileNames.length < 2) return '';
  if (fileNames.every(startsWithTrackNumber)) return '';

  // 「01」「02」の共通部分である先頭の 0 まで拾ってしまうため、末尾の数字は戻す。
  // 番号そのものを削ってしまっては意味がない。
  return longestCommonPrefix(fileNames).replace(/\d+$/, '');
}

/**
 * 先頭が一致するときだけ削る。結果が空、あるいは拡張子しか残らない場合は
 * 元の名前を返す（そのファイルは変更なしとして扱われる）。
 */
export function applyPrefixRemoval(fileName: string, prefix: string): string {
  if (prefix === '' || !fileName.startsWith(prefix)) return fileName;

  const removed = fileName.slice(prefix.length);
  if (removed === '' || removed.startsWith('.')) return fileName;

  return removed;
}
