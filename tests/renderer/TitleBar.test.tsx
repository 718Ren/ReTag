// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TitleBar } from '../../src/renderer/src/components/TitleBar';

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
  it('ウィンドウ操作ボタンは持たない', () => {
    render(<TitleBar />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('プロダクト名の文字は出さない（マークだけで示す）', () => {
    render(<TitleBar />);
    expect(screen.queryByText('ReTag')).toBeNull();
  });
});
