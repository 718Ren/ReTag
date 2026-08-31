export type Origin = { x: number; y: number };

/** 起点から画面の四隅までで一番遠い距離。円がここまで広がれば全面を覆える */
export function farthestCorner(origin: Origin, width: number, height: number): number {
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  return Math.hypot(dx, dy);
}

function prefersReducedMotion(): boolean {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type ViewTransition = { ready: Promise<void> };
type StartViewTransition = (callback: () => void) => ViewTransition;

const DURATION_MS = 480;

/**
 * 押した場所から円形に広がって新しい配色が現れる。
 * View Transitions が無い環境や、動きを控える設定のときは素直に切り替える。
 */
export function revealTheme(origin: Origin, apply: () => void): void {
  const start = Reflect.get(document, 'startViewTransition') as StartViewTransition | undefined;

  if (typeof start !== 'function' || prefersReducedMotion()) {
    apply();
    return;
  }

  let transition: ViewTransition;
  try {
    transition = start.call(document, apply);
  } catch {
    // 演出できないだけで、切り替えは通す
    apply();
    return;
  }

  const radius = farthestCorner(origin, innerWidth, innerHeight);
  void transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: DURATION_MS,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        // 新しい配色の側だけを切り抜く。古い側は下に敷いたままにする
        pseudoElement: '::view-transition-new(root)',
      },
    );
  });
}
