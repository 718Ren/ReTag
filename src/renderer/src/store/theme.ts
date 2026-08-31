export type Theme = 'light' | 'dark';

export const THEME_KEY = 'retag:theme';

/** OS 側の設定。読めない環境では light を既定にする */
function systemTheme(): Theme {
  if (typeof matchMedia !== 'function') return 'light';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 選んだことがあればそれを、なければ OS の設定を使う */
export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage が使えなくても OS の設定で動かせる
  }
  return systemTheme();
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // 覚えられないだけで、その場の切り替えは効く
  }
}

export function nextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
