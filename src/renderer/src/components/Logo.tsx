/**
 * ReTag のマーク。タグ（荷札）の輪郭と紐通しの穴。20px でも線が消えないよう、太さは 2.8 にしている。
 * 色は currentColor に従うので、置いた場所の文字色になる。
 */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="logo"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      role="img"
      aria-label="ReTag"
    >
      <polygon points="9.00,13.00 36.00,13.00 57.00,32.00 36.00,51.00 9.00,51.00" strokeWidth="2.8" />
      <circle cx="18" cy="32" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
