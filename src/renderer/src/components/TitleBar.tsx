import { Logo } from './Logo';

/**
 * ウィンドウ上端の帯。最小化・最大化・閉じるは titleBarOverlay で Windows が
 * 描くので、こちらはマークを出して掴める領域にするだけ。
 */
export function TitleBar() {
  return (
    <header className="title-bar">
      <Logo />
    </header>
  );
}
