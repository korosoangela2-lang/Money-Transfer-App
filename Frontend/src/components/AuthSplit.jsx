import { ShieldCheck, Globe2, Zap } from "lucide-react";
import { T, SANS, DISPLAY } from "../lib/theme.jsx";
import { BRAND_FULL } from "../lib/brand.js";
import { BackgroundArt } from "./BackgroundArt.jsx";
import { Logo } from "./Logo.jsx";

const FEATURES = [
  { icon: Zap, text: "Money lands in minutes, not days" },
  { icon: Globe2, text: "Real exchange rates, no hidden markup" },
  { icon: ShieldCheck, text: "Licensed, regulated and fully insured" },
];

/** Two-panel website layout for auth screens: a branding panel on desktop, form on the right. */
export function AuthSplit({ children }) {
  return (
    <div className="flex min-h-screen w-full">
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{ width: "42%", minWidth: 420, background: `linear-gradient(160deg, #171017 0%, ${T.ink} 55%, #241318 100%)`, color: "#fff", padding: "56px 48px" }}
      >
        <div className="absolute rounded-full" style={{ width: 420, height: 420, top: -160, right: -160, background: `radial-gradient(circle, ${T.marigold}33 0%, transparent 70%)`, filter: "blur(8px)" }} />
        <div className="absolute rounded-full" style={{ width: 320, height: 320, bottom: -140, left: -120, background: `radial-gradient(circle, ${T.pine}55 0%, transparent 70%)`, filter: "blur(8px)" }} />
        <div className="absolute rounded-full" style={{ width: 260, height: 260, top: "38%", left: "58%", background: `radial-gradient(circle, ${T.brick}33 0%, transparent 72%)`, filter: "blur(10px)" }} />
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.5,
            mixBlendMode: "overlay",
            backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44NSIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==")',
          }}
        />
        <BackgroundArt tone="dark" style={{ opacity: 0.8 }} />

        <Logo tone="marigold" size={30} textSize={19} className="relative" />
        <div className="flex flex-col gap-6 relative">
          <div className="text-4xl leading-tight" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>Send money home,<br />without the markup.</div>
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                <span className="rounded-full flex items-center justify-center" style={{ width: 30, height: 30, background: "rgba(255,255,255,0.1)", flexShrink: 0 }}>
                  <Icon size={15} />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs relative" style={{ color: "rgba(255,255,255,0.4)" }}>© {new Date().getFullYear()} {BRAND_FULL}</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ fontFamily: SANS }}>
        <Logo tone="pine" size={28} textSize={19} className="lg:hidden mb-8" />
        <div className="w-full flex flex-col gap-6 halcyon-rise" style={{ maxWidth: 380 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
