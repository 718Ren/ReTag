/**
 * ReTag のマーク。タグ（荷札）の形。小さく出しても潰れないよう、線ではなく塗りで描く。
 * アイコン（resources/icon.ico）と同じ図形。
 * 色は currentColor に従うので、置いた場所の文字色になる。
 */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="logo"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label="ReTag"
    >
      <path
        fillRule="evenodd"
        d="M9 13H36L57 32L36 51H9V13ZM14.8 32a3.2 3.2 0 106.4 0 3.2 3.2 0 10-6.4 0Z"
      />
    </svg>
  );
}
