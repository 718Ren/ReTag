import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * つまみを掴んで横幅を変える共通処理。ペイン境界と列境界の両方で使う。
 * onResize には「掴んだ時点の幅 + 動かした距離」を渡す。
 */
export function useDragResize(onResize: (width: number) => void) {
  const origin = useRef({ x: 0, width: 0 });

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      onResize(origin.current.width + (event.clientX - origin.current.x));
    },
    [onResize],
  );

  const onPointerUp = useCallback(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    document.body.classList.remove('resizing');
  }, [onPointerMove]);

  return useCallback(
    (event: ReactPointerEvent<HTMLElement>, currentWidth: number) => {
      event.preventDefault();
      origin.current = { x: event.clientX, width: currentWidth };
      document.body.classList.add('resizing');
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [onPointerMove, onPointerUp],
  );
}
