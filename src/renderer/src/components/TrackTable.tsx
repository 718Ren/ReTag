import type { MouseEvent } from 'react';
import { actions, useAppState } from '../store/appStore';
import { useDragResize } from './useDragResize';
import { formatQuality, isHighResolution } from '../../../shared/hiRes';

/**
 * Title は幅を持たせず残りを埋める。合計幅が表示領域と一致するので、
 * 右端の列が見切れない。widthIndex は layout.columnWidths の位置。
 */
const COLUMNS: { label: string; widthIndex: number | null }[] = [
  { label: '', widthIndex: null }, // HR バッジ用。幅は CSS で固定
  { label: 'Track#', widthIndex: 0 },
  { label: 'Title', widthIndex: null },
  { label: 'Artist', widthIndex: 1 },
  { label: 'Album', widthIndex: 2 },
  { label: '長さ', widthIndex: 3 },
];

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function TrackTable() {
  const state = useAppState();
  const widths = state.layout.columnWidths;

  function handleClick(event: MouseEvent<HTMLTableRowElement>, path: string): void {
    const paths = state.tracks.map((track) => track.path);

    if (event.shiftKey && state.selectedPaths.length > 0) {
      const last = state.selectedPaths[state.selectedPaths.length - 1];
      const from = paths.indexOf(last);
      const to = paths.indexOf(path);
      const [start, end] = from < to ? [from, to] : [to, from];
      actions.selectTracks(paths.slice(start, end + 1));
      return;
    }

    if (event.ctrlKey) {
      const next = state.selectedPaths.includes(path)
        ? state.selectedPaths.filter((selected) => selected !== path)
        : [...state.selectedPaths, path];
      actions.selectTracks(next);
      return;
    }

    actions.selectTracks([path]);
  }

  return (
    <section className="track-table">
      {/* 表の外側（行の下の余白）を押したら選択を外す。行のクリックは伝播を止めない
          ため、行側の処理が先に走って選択が確定する */}
      <div
        className="track-table-scroll"
        onClick={(event) => {
          if (event.target === event.currentTarget) actions.selectTracks([]);
        }}
      >
        <table>
          <thead>
            <tr>
              {COLUMNS.map((column, index) => (
                <ColumnHeader
                  key={column.label || `badge-${index}`}
                  label={column.label}
                  widthIndex={column.widthIndex}
                  width={column.widthIndex === null ? null : widths[column.widthIndex]}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {state.loadingTracks
              ? null
              : state.tracks.map((track) => {
              const hiRes = isHighResolution(track.bitDepth, track.sampleRate);
              const quality = formatQuality(track.bitDepth, track.sampleRate);

              return (
                <tr
                  key={track.path}
                  className={state.selectedPaths.includes(track.path) ? 'selected' : undefined}
                  onClick={(event) => handleClick(event, track.path)}
                >
                  <td className="hi-res-cell">
                    {hiRes && (
                      <span className="hi-res" title={quality}>
                        HR
                      </span>
                    )}
                  </td>
                  <td>
                    {track.trackNumber === null
                      ? ''
                      : `${track.trackNumber}${track.trackCount ? `/${track.trackCount}` : ''}`}
                  </td>
                  <td title={track.title}>{track.title}</td>
                  <td title={track.artist}>{track.artist}</td>
                  <td title={track.album}>{track.album}</td>
                  <td>{formatDuration(track.durationSec)}</td>
                </tr>
                );
                })}
            {!state.loadingTracks && state.failures.map((failure) => (
              <tr key={failure.path} className="failed">
                <td colSpan={COLUMNS.length}>
                  <span title={failure.message}>⚠</span> {failure.path}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {state.loadingTracks && (
          <div className="track-loading" role="status" aria-label="読み込み中">
            <span className="spinner" />
          </div>
        )}
      </div>
    </section>
  );
}

function ColumnHeader({
  label,
  widthIndex,
  width,
}: {
  label: string;
  widthIndex: number | null;
  width: number | null;
}) {
  const startDrag = useDragResize((next) => {
    if (widthIndex !== null) actions.setColumnWidth(widthIndex, next);
  });

  // 幅を持つ列だけ調整できる。最終列を動かすと総幅が表示領域からずれてしまう
  const resizable = widthIndex !== null && width !== null && label !== '長さ';

  return (
    <th
      className={label === '' ? 'hi-res-cell' : undefined}
      style={width === null ? undefined : { width: `${width}px` }}
    >
      <span className="column-label">{label}</span>
      {resizable && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label={`${label} の幅を変更`}
          className="column-grip"
          onPointerDown={(event) => startDrag(event, width)}
        />
      )}
    </th>
  );
}
