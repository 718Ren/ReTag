// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest';
import {
  clampColumnWidth,
  clampPaneWidth,
  DEFAULT_LAYOUT,
  loadLayout,
  saveLayout,
} from '../../src/renderer/src/store/layout';

describe('clampPaneWidth', () => {
  it('範囲内はそのまま返す', () => {
    expect(clampPaneWidth(320)).toBe(320);
  });

  it('狭すぎる値を下限に丸める', () => {
    expect(clampPaneWidth(20)).toBe(160);
  });

  it('広すぎる値を上限に丸める', () => {
    expect(clampPaneWidth(2000)).toBe(320);
  });
});

describe('clampColumnWidth', () => {
  it('潰れないように下限を設ける', () => {
    expect(clampColumnWidth(5)).toBe(48);
  });

  it('範囲内はそのまま返す', () => {
    expect(clampColumnWidth(200)).toBe(200);
  });
});

describe('loadLayout / saveLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存していなければ既定値を返す', () => {
    expect(loadLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('保存した値を読み戻す', () => {
    saveLayout({ paneWidth: 400, columnWidths: [200, 60, 240, 200] });
    expect(loadLayout().paneWidth).toBe(320);
    expect(loadLayout().columnWidths[0]).toBe(200);
  });

  it('保存時に範囲外の値を丸める', () => {
    saveLayout({ paneWidth: 5000, columnWidths: [1, 60, 240, 200] });
    expect(loadLayout().paneWidth).toBe(320);
    expect(loadLayout().columnWidths[0]).toBe(48);
  });

  it('壊れた値が入っていても既定値に戻る', () => {
    localStorage.setItem('retag:layout', '{ not json');
    expect(loadLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('列数が合わない値は無視して既定値を使う', () => {
    localStorage.setItem(
      'retag:layout',
      JSON.stringify({ paneWidth: 300, columnWidths: [100, 100] }),
    );
    expect(loadLayout().columnWidths).toEqual(DEFAULT_LAYOUT.columnWidths);
  });
});
