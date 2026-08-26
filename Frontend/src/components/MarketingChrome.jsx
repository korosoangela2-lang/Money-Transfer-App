import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { T } from "../lib/theme.jsx";
import { BRAND_FULL, BRAND_TAGLINE } from "../lib/brand.js";
import { Button } from "./primitives.jsx";
import { Logo } from "./Logo.jsx";

/** Shared marketing-site header. `nav` items with an href starting in "#" are same-page
 *  anchors (only meaningful on the page that owns those sections); everything else routes.
 *  Below the `lg` breakpoint the inline nav has nowhere to go, so it collapses into a
 *  hamburger-triggered dropdown instead of disappearing. */
export function MarketingHeader({ nav }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (href) => {
    setOpen(false);
    if (!href.startsWith("#")) navigate(href);
  };

  return (
    <header className="relative" style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, zIndex: 2 }}>
      <div className="flex items-center justify-between px-4 lg:px-12" style={{ height: 84 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", padding: 0 }}>
          <Logo size={24} textSize={16} />
        </button>
        <nav
          className="hidden lg:flex items-center gap-8 text-sm font-semibold absolute left-1/2"
          style={{ color: T.ink, transform: "translateX(-50%)" }}
        >
          {nav.map((item) =>
            item.href.startsWith("#") ? (
              <a key={item.label} href={item.href} className="heha-link">{item.label}</a>
            ) : (
              <button key={item.label} onClick={() => navigate(item.href)} className="heha-link" style={{ background: "none", border: "none", padding: 0, fontWeight: 600, fontSize: "inherit", fontFamily: "inherit" }}>
                {item.label}
              </button>
            )
          )}
        </nav>
        <div className="flex items-center gap-3 lg:gap-4" style={{ flexShrink: 0 }}>
          <button className="hidden sm:inline text-sm font-medium heha-link" style={{ color: T.muted, whiteSpace: "nowrap" }} onClick={() => navigate("/login")}>
            Log in
          </button>
          <Button size="sm" style={{ whiteSpace: "nowrap", borderRadius: 10 }} onClick={() => navigate("/register")}>Get started</Button>
          <button
            className="lg:hidden flex items-center justify-center"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            style={{ background: "none", border: "none", padding: 4, color: T.ink }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="lg:hidden flex flex-col heha-rise"
          style={{ borderTop: `1px solid ${T.line}`, background: T.surface }}
        >
          {nav.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="heha-link text-sm font-semibold px-6 py-3.5"
                style={{ borderTop: `1px solid ${T.line}` }}
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                onClick={() => go(item.href)}
                className="heha-link text-left text-sm font-semibold px-6 py-3.5"
                style={{ background: "none", border: "none", borderTop: `1px solid ${T.line}` }}
              >
                {item.label}
              </button>
            )
          )}
        </nav>
      )}
    </header>
  );
}

/** Shared marketing-site footer. `columns` is an array of { heading, links: [{ label, to }] }. */
export function MarketingFooter({ columns }) {
  const navigate = useNavigate();
  return (
    <footer style={{ borderTop: `1px solid ${T.line}` }}>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 px-6 lg:px-12 py-12 mx-auto w-full" style={{ maxWidth: 1180 }}>
        <div className="col-span-2 flex flex-col gap-3">
          <Logo size={22} textSize={15} />
          <p className="text-xs" style={{ color: T.faint, maxWidth: 260 }}>{BRAND_TAGLINE}</p>
        </div>
        {columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-2.5 text-sm">
            <div className="text-xs font-semibold mb-1" style={{ color: T.faint, letterSpacing: "0.04em" }}>{col.heading}</div>
            {col.links.map((link) =>
              link.to.startsWith("#") ? (
                <a key={link.label} href={link.to} className="heha-link">{link.label}</a>
              ) : (
                <button key={link.label} className="text-left heha-link" style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit" }} onClick={() => navigate(link.to)}>
                  {link.label}
                </button>
              )
            )}
          </div>
        ))}
      </div>
      <div className="px-6 lg:px-12 py-5 text-xs" style={{ color: T.faint, borderTop: `1px solid ${T.line}` }}>
        © {new Date().getFullYear()} {BRAND_FULL}. All rights reserved.
      </div>
    </footer>
  );
}

