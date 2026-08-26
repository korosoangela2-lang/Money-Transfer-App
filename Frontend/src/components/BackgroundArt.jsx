import { T } from "../lib/theme.jsx";

const ROUTES = [
  "M 90,560 C 340,380 620,700 980,260",
  "M 240,110 C 520,300 760,60 1300,210",
  "M 40,760 C 360,900 620,660 1040,830",
  "M 700,40 C 860,220 1040,140 1260,380",
  "M -40,300 C 220,180 360,460 660,470",
  "M 520,860 C 760,760 900,900 1180,720",
  "M 900,20 C 1080,90 1160,10 1440,120",
  "M -20,120 C 140,40 260,140 420,60",
];

const NODES = [
  [90, 560], [980, 260], [240, 110], [1300, 210],
  [40, 760], [1040, 830], [700, 40], [1260, 380],
  [640, 470], [660, 470], [1180, 720], [1440, 120],
  [420, 60], [820, 610], [1360, 560], [150, 340],
];

/** A paper-plane glyph (echoes the app's own Send icon) marking a route in flight. */
const PLANE_D = ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"];
const PLANES = [
  { x: 700, y: 700, rotate: 15, scale: 2.2 },
  { x: 1120, y: 300, rotate: -28, scale: 2.2 },
  { x: 340, y: 830, rotate: -35, scale: 1.8 },
  { x: 980, y: 780, rotate: -12, scale: 2.3 },
];

/** Decorative "send money across the world" line-art — flight-path arcs, way-point nodes and paper-plane glyphs, echoing the remittance story. Purely ambient: aria-hidden, non-interactive. */
export function BackgroundArt({ tone = "light", style }) {
  const line = tone === "light" ? "rgba(18,22,31,0.10)" : "rgba(255,255,255,0.18)";
  const nodeFill = tone === "light" ? T.pine : T.marigold;
  const globe = tone === "light" ? "rgba(18,22,31,0.07)" : "rgba(255,255,255,0.12)";
  const planeStroke = tone === "light" ? T.brick : T.marigold;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0"
      style={{ width: "100%", height: "100%", pointerEvents: "none", ...style }}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <circle cx="180" cy="180" r="150" stroke={globe} strokeWidth="1" />
      <circle cx="1260" cy="740" r="210" stroke={globe} strokeWidth="1" />
      <circle cx="1260" cy="740" r="150" stroke={globe} strokeWidth="1" />
      <circle cx="700" cy="470" r="260" stroke={globe} strokeWidth="1" />
      <circle cx="60" cy="820" r="120" stroke={globe} strokeWidth="1" />
      <circle cx="1380" cy="80" r="90" stroke={globe} strokeWidth="1" />

      {ROUTES.map((d, i) => (
        <path key={i} d={d} stroke={line} strokeWidth={i % 3 === 0 ? 1.4 : 1} strokeDasharray="1.5 9" strokeLinecap="round" />
      ))}

      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3.5 : 2.5} fill={nodeFill} opacity={tone === "light" ? 0.32 : 0.5} />
      ))}

      {PLANES.map(({ x, y, rotate, scale }, i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={tone === "light" ? 0.4 : 0.55}>
          <g transform="translate(-11 -11)" stroke={planeStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={PLANE_D[0]} />
            <path d={PLANE_D[1]} />
          </g>
        </g>
      ))}
    </svg>
  );
}
