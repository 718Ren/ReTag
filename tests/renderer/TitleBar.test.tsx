// @vitest-environment jsdom
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TitleBar } from '../../src/renderer/src/components/TitleBar';
import { __setStateForTest, __getStateForTest } from '../../src/renderer/src/store/appStore';

beforeEach(() => {
  // 切り替えは main にも伝わる。ここでは呼ばれても困らないだけでよい
  vi.stubGlobal('api', { applyTheme: vi.fn().mockResolvedValue(undefined) });
  __setStateForTest({ theme: 'dark' });
});

describe('TitleBar', () => {
  it('ロゴを表示する', () => {
    render(<TitleBar />);
    expect(screen.getByRole('img', { name: 'ReTag' })).toBeDefined();
  });

  it('ウィンドウを掴んで動かせる領域として印を付ける', () => {
    const { container } = render(<TitleBar />);
    expect(container.querySelector('.title-bar')).not.toBeNull();
  });

  // ネイティブの最小化・最大化・閉じるは Windows が描くので、自前では持たない
  it('ウィンドウ操作ボタンはテーマ切り替えだけ', () => {
    render(<TitleBar />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('プロダクト名の文字は出さない（マークだけで示す）', () => {
    render(<TitleBar />);
    expect(screen.queryByText('ReTag')).toBeNull();
  });

  it('ダークのときはライトへ切り替えるボタンを出す', () => {
    render(<TitleBar />);
    expect(screen.getByRole('button', { name: 'ライトモードに切り替える' })).toBeDefined();
  });

  it('ライトのときはダークへ切り替えるボタンを出す', () => {
    __setStateForTest({ theme: 'light' });
    render(<TitleBar />);
    expect(screen.getByRole('button', { name: 'ダークモードに切り替える' })).toBeDefined();
  });

  it('押すとテーマが入れ替わる', () => {
    render(<TitleBar />);
    fireEvent.click(screen.getByRole('button', { name: 'ライトモードに切り替える' }));
    expect(__getStateForTest().theme).toBe('light');
  });

  // 帯そのものは掴めるが、ボタンの上ではドラッグにならないようにする
  it('切り替えボタンは掴む領域から外す', () => {
    const { container } = render(<TitleBar />);
    expect(container.querySelector('.theme-toggle')).not.toBeNull();
  });
});
