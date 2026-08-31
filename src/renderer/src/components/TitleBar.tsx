import { Logo } from './Logo';
import { actions, useAppState } from '../store/appStore';
import { revealTheme } from '../store/reveal';

/** 太陽と月。線は currentColor に従うので、帯の文字色で描かれる */
function ThemeIcon({ dark }: { dark: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {dark ? (
        // ダークの間は「ライトに戻す」ので太陽を出す
        <>
          <circle cx="12" cy="12" r="4.2" />
          <path
            strokeLinecap="round"
            d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"
          />
        </>
      ) : (
        <path
          strokeLinejoin="round"
          d="M20 14.4A8.4 8.4 0 019.6 4a8.4 8.4 0 1010.4 10.4z"
        />
      )}
    </svg>
  );
}

/**
 * ウィンドウ上端の帯。最小化・最大化・閉じるは titleBarOverlay で Windows が
 * 描くので、こちらはマークと明暗の切り替えを置いて、残りを掴める領域にする。
 */
export function TitleBar() {
  const { theme } = useAppState();
  const dark = theme === 'dark';

  return (
    <header className="title-bar">
      <Logo />
      <button
        type="button"
        className="theme-toggle"
        aria-label={dark ? 'ライトモードに切り替える' : 'ダークモードに切り替える'}
        title={dark ? 'ライトモードに切り替える' : 'ダークモードに切り替える'}
        onClick={(event) => {
          // 押したボタンの中心から広がらせる
          const box = event.currentTarget.getBoundingClientRect();
          revealTheme({ x: box.left + box.width / 2, y: box.top + box.height / 2 }, () =>
            actions.toggleTheme(),
          );
        }}
      >
        {/* テーマが変わると別要素になり、出現のアニメーションが流れる */}
        <ThemeIcon key={theme} dark={dark} />
      </button>
    </header>
  );
}
