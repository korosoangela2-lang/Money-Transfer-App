export const T = {
  ink: "#12161F",
  ink80: "#2A3040",
  bg: "#F2E1E5",
  paper: "#F1F3F2",
  surface: "#FFFFFF",
  line: "#DFE3E1",
  pine: "#0A5F4F",
  pineSoft: "#E4F0EC",
  marigold: "#F2A93B",
  marigoldSoft: "#FDF1DC",
  brick: "#B3392C",
  brickSoft: "#F8E7E4",
  muted: "#5C6670",
  faint: "#8A939B",
};

export const SANS = "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, 'Roboto Mono', monospace";
export const DISPLAY = "'Fraunces', ui-serif, Georgia, serif";

export const shadow = {
  sm: "0 1px 2px rgba(30,16,20,0.04), 0 2px 8px rgba(30,16,20,0.05)",
  md: "0 2px 6px rgba(30,16,20,0.05), 0 12px 28px rgba(30,16,20,0.08)",
  lg: "0 8px 16px rgba(30,16,20,0.08), 0 24px 48px rgba(30,16,20,0.12)",
};

export const cardStyle = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, boxShadow: shadow.sm };

const GLOBAL_STYLE_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
    .halcyon * { box-sizing: border-box; }
    .halcyon button { font-family: inherit; cursor: pointer; }
    .halcyon input, .halcyon select { font-family: inherit; }
    .halcyon :focus-visible { outline: 2px solid ${T.marigold}; outline-offset: 2px; border-radius: 4px; }
    .halcyon input::placeholder { color: ${T.faint}; }
    .halcyon-bg {
      background-color: ${T.bg};
      background-image:
        radial-gradient(820px circle at 6% -10%, rgba(10,95,79,0.20), transparent 60%),
        radial-gradient(680px circle at 98% -4%, rgba(242,169,59,0.26), transparent 58%),
        radial-gradient(760px circle at 90% 88%, rgba(179,57,44,0.18), transparent 60%),
        radial-gradient(640px circle at 2% 96%, rgba(122,44,74,0.17), transparent 58%),
        radial-gradient(900px circle at 48% 42%, rgba(255,255,255,0.55), transparent 62%),
        url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44NSIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==");
      background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, repeat;
      background-blend-mode: normal, normal, normal, normal, normal, overlay;
    }
    .halcyon-page { display: flex; flex-direction: column; width: 100%; flex: 1; min-width: 0; }
    .halcyon-container { display: flex; flex-direction: column; width: 100%; max-width: 720px; min-height: 100%; margin: 0 auto; }
    .halcyon-link { color: ${T.pine}; text-decoration: none; }
    .halcyon-link:hover { text-decoration: underline; }
    .halcyon-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .halcyon-scroll::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 99px; }
    .halcyon button { transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease, background-color .15s ease; }
    .halcyon button:hover:not(:disabled) { transform: translateY(-1px); }
    .halcyon button:active:not(:disabled) { transform: translateY(0); }
    .halcyon-card { transition: transform .18s ease, box-shadow .18s ease; }
    a.halcyon-card:hover, button.halcyon-card:hover { transform: translateY(-2px); box-shadow: ${shadow.md}; }
    @keyframes halcyon-tick { 0% { opacity: .35; transform: translateY(-2px); } 100% { opacity: 1; transform: none; } }
    @keyframes halcyon-rise { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: none; } }
    @keyframes halcyon-spin { to { transform: rotate(360deg); } }
    @keyframes halcyon-crawl { to { background-position: 14px 0; } }
    .halcyon-tick { animation: halcyon-tick .28s ease-out; }
    .halcyon-rise { animation: halcyon-rise .3s ease-out both; }
    .halcyon-spin { animation: halcyon-spin .9s linear infinite; }
    @media (prefers-reduced-motion: reduce) {
      .halcyon *, .halcyon *::before, .halcyon *::after { animation: none !important; transition: none !important; }
    }
  `;

export const GlobalStyle = () => <style>{GLOBAL_STYLE_CSS}</style>;

export const inputStyle = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: T.ink, width: "100%" };

export const TONE = {
  pine: { bg: T.pineSoft, fg: T.pine },
  marigold: { bg: T.marigoldSoft, fg: "#8A5A0F" },
  brick: { bg: T.brickSoft, fg: T.brick },
  muted: { bg: T.paper, fg: T.muted },
};

export const STATUS_TONE = {
  completed: "pine", active: "pine", verified: "pine", paid: "pine",
  pending: "marigold",
  failed: "brick", suspended: "brick", rejected: "brick", declined: "brick",
  unverified: "muted",
};
