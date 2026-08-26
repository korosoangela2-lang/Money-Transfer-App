import { T, DISPLAY } from "../lib/theme.jsx";
import { BRAND_FULL, BRAND_LETTER } from "../lib/brand.js";

/** Coin mark — same glyph as public/favicon.svg, so the tab icon and in-app logo match. */
function LogoMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect width="24" height="24" rx="5.25" fill={T.pine} />
      <circle cx="12" cy="12" r="5.6" fill="none" stroke={T.marigold} strokeWidth="1.2" />
      <text x="12" y="14.9" fontFamily="Georgia, 'Times New Roman', serif" fontSize="6.75" fontWeight="700" fill="#F8F4EC" textAnchor="middle">{BRAND_LETTER}</text>
    </svg>
  );
}

const TONES = { pine: T.pine, marigold: T.marigold, light: "#fff" };

export function Logo({ size = 26, textSize = 17, tone = "pine", wordmark = BRAND_FULL, className, style }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className || ""}`} style={style}>
      <LogoMark size={size} />
      <span style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: textSize, color: TONES[tone] || tone, lineHeight: 1, whiteSpace: "nowrap" }}>
        {wordmark}
      </span>
    </span>
  );
}
