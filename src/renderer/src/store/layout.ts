const STORAGE_KEY = 'retag:layout';

const PANE_MIN = 160;
// 320px を超えると数値欄（Disc / Track / Year）が2行に折り返すため、そこで止める
const PANE_MAX = 320;
const COLUMN_MIN = 48;
const COLUMN_MAX = 800;

export type Layout = {
  paneWidth: number;
  /** 幅を固定する列（Track# / Artist / Album / 長さ）。Title は残りを埋めるので持たない */
  columnWidths: number[];
};

export const DEFAULT_LAYOUT: Layout = {
  paneWidth: 280,
  columnWidths: [78, 168, 168, 56],
};

export function clampPaneWidth(width: number): number {
  return Math.min(PANE_MAX, Math.max(PANE_MIN, Math.round(width)));
}

export function clampColumnWidth(width: number): number {
  return Math.min(COLUMN_MAX, Math.max(COLUMN_MIN, Math.round(width)));
}

function normalize(layout: Layout): Layout {
  return {
    paneWidth: clampPaneWidth(layout.paneWidth),
    columnWidths: layout.columnWidths.map(clampColumnWidth),
  };
}

export function loadLayout(): Layout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_LAYOUT;

    const { paneWidth, columnWidths } = parsed as Partial<Layout>;
    if (typeof paneWidth !== 'number' || !Array.isArray(columnWidths)) return DEFAULT_LAYOUT;
    // 列数が変わった後の古い保存値は形が合わないので捨てる
    if (columnWidths.length !== DEFAULT_LAYOUT.columnWidths.length) return DEFAULT_LAYOUT;
    if (columnWidths.some((width) => typeof width !== 'number')) return DEFAULT_LAYOUT;

    return normalize({ paneWidth, columnWidths });
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayout(layout: Layout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalize(layout)));
  } catch {
    // プライベートウィンドウなどで書けなくても、幅が保存されないだけで動作に影響はない
  }
}
