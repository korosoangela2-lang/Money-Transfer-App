import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft, ArrowRight, Banknote, Check, ChevronDown, Clock, Globe2,
  Heart, LifeBuoy, LineChart as LineChartIcon, Mail, PlayCircle, Plus,
  Send, Shield, ShieldCheck, Smartphone, Sparkles, X,
} from "lucide-react";
import { T, SANS, DISPLAY, MONO, cardStyle, shadow } from "../lib/theme.jsx";
import { BRAND_FULL, BRAND_NAME, BRAND_TAGLINE } from "../lib/brand.js";
import { CORRIDORS, BASE_RATES, PAYOUT_METHODS } from "../lib/constants.js";
import { PRICING, quote } from "../lib/pricing.js";
import { money, rateFmt } from "../lib/format.js";
import { Button, TxRow } from "../components/primitives.jsx";
import { BackgroundArt } from "../components/BackgroundArt.jsx";
import { MarketingHeader, MarketingFooter } from "../components/MarketingChrome.jsx";

const LANDING_NAV = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Features", href: "#features" },
  { label: "About us", href: "#about-us" },
  { label: "Help", href: "#help" },
];

const LANDING_FOOTER_COLUMNS = [
  {
    heading: "PRODUCT",
    links: [
      { label: "How it works", to: "#how-it-works" },
      { label: "Dashboard", to: "#dashboard" },
      { label: "Features", to: "#features" },
      { label: "Countries", to: "#countries" },
    ],
  },
  {
    heading: "COMPANY",
    links: [
      { label: "About us", to: "#about-us" },
      { label: "Help", to: "#help" },
    ],
  },
  {
    heading: "ACCOUNT",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Create account", to: "/register" },
    ],
  },
];

const STEPS = [
  { n: "01", title: "Fund your wallet", text: "Add money by card, Interac, or M-Pesa — it's in your wallet in seconds." },
  { n: "02", title: "Add who you're sending to", text: "Save their mobile money, bank, or cash pickup details once, reuse it every time." },
  { n: "03", title: "Send, at the real rate", text: "One visible fee, the live exchange rate, and it lands with them in minutes." },
];

const FEATURES = [
  { icon: LineChartIcon, title: "Real exchange rates", text: "The mid-market rate, live, on every quote — the same number you'd see on a currency site, not a marked-up version of it." },
  { icon: Banknote, title: "One visible fee", text: `A flat ${(PRICING.feeRate * 100).toFixed(1)}% fee plus a disclosed ${(PRICING.spread * 100).toFixed(2)}% spread, shown before you send — never buried in the rate.` },
  { icon: Clock, title: "Fast delivery", text: "Mobile money lands in minutes, bank deposits in under two hours, cash pickup within the day." },
  { icon: Smartphone, title: "Flexible payout", text: "Send to mobile money, a bank account, or a cash pickup counter — recipients choose what works for them." },
  { icon: Shield, title: "Licensed and insured", text: "Regulated money transmission with every transfer covered — your money is protected in transit." },
  { icon: Globe2, title: "Corridors that matter", text: "Kenya, Uganda, Nigeria, and Ghana today, with more corridors added as demand grows." },
];

const VALUES = [
  { icon: Sparkles, title: "Transparent by default", text: "One visible fee, the real exchange rate, no fine print — we show our math on every quote." },
  { icon: Heart, title: "Built for the people sending", text: "Every design decision starts from what makes remittances stressful, and removes it." },
  { icon: ShieldCheck, title: "Regulated and accountable", text: "Licensed money transmission with your funds protected in transit, every time." },
];

const STATS = [
  ["4", "corridors served"],
  ["~0.9%", "flat fee, always visible"],
  ["<2 min", "typical mobile money delivery"],
];

const FAQS = [
  { q: "How long does a transfer take?", a: `It depends on the payout method: ${PAYOUT_METHODS.map((m) => `${m.label.toLowerCase()} in about ${m.minutes} minutes`).join(", ")}.` },
  { q: "What does it actually cost to send money?", a: `A flat ${(PRICING.feeRate * 100).toFixed(1)}% fee (minimum $${PRICING.feeMin.toFixed(2)}, capped at $${PRICING.feeCap.toFixed(2)}), plus a disclosed ${(PRICING.spread * 100).toFixed(2)}% FX spread on the exchange rate. Both are shown before you confirm — nothing else is deducted.` },
  { q: "Which countries can I send to?", a: "Kenya, Uganda, Nigeria, and Ghana today, with more corridors on the way." },
  { q: "How do I add money to my wallet?", a: "From Home, tap Add funds and choose card, Interac, or M-Pesa. Funds are usually available in your wallet within seconds." },
  { q: "Is my money protected?", a: "Yes. We're a licensed, regulated money transmitter and every transfer is fully insured while it's in transit." },
  { q: "I forgot my password — what now?", a: "Use \"Forgot password?\" on the login screen. We'll email you a reset link that's valid for a short window." },
];

/** Static sample data for the dashboard preview — this section doesn't touch the store;
 *  the real, live version is what you land on at /home after signing in. */
const SAMPLE_FLOW = [
  { month: "Apr", added: 900, sent: 400 },
  { month: "May", added: 1400, sent: 950 },
  { month: "Jun", added: 1100, sent: 1300 },
  { month: "Jul", added: 1800, sent: 700 },
  { month: "Aug", added: 1500, sent: 1100 },
];
const FLOW_MAX = Math.max(...SAMPLE_FLOW.flatMap((d) => [d.added, d.sent]));

const SAMPLE_TX = [
  { id: "s1", name: "To Amina Njoroge", type: "send", amount: 220, status: "completed", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "s2", name: "Wallet top-up", type: "deposit", amount: 500, status: "completed", createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "s3", name: "To Kwame Boateng", type: "send", amount: 150, status: "pending", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
];

const DASHBOARD_CALLOUTS = [
  ["Wallet balance", "See exactly what's available to send, at a glance."],
  ["Money in vs. out", "A running view of deposits against transfers, month by month."],
  ["Recent activity", "Every send and top-up, with live status — no need to ask what happened."],
];

const SAMPLE_AMOUNT = 500;
const q = quote(SAMPLE_AMOUNT, BASE_RATES.KES);
const bankCost = Math.round(SAMPLE_AMOUNT * PRICING.bankBenchmark * 100) / 100;
const halcyonCost = q.fee + q.spreadRevenue;

function SectionHeading({ children }) {
  return <div className="text-2xl lg:text-3xl mb-10" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{children}</div>;
}

/** A hand-rolled sparkline for the dashboard preview — avoids pulling recharts (and its
 *  ~380KB chunk) into the landing page's initial bundle just to plot five sample points. */
function MiniAreaChart({ data, seriesKey, color, max, width = 400, height = 140 }) {
  const step = width / (data.length - 1);
  const points = data.map((d, i) => [i * step, height - (d[seriesKey] / max) * height]);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${width},${height} L 0,${height} Z`;
  const gradientId = `landing-${seriesKey}-fill`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left" style={{ background: "none", border: "none" }}>
        <span className="text-sm font-semibold">{q}</span>
        <ChevronDown size={17} style={{ color: T.faint, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s ease", flexShrink: 0 }} />
      </button>
      {open && <div className="px-5 pb-4 text-sm halcyon-rise" style={{ color: T.muted }}>{a}</div>}
    </div>
  );
}

export default function LandingScreen() {
  const navigate = useNavigate();
  const [heroAmount, setHeroAmount] = useState(1000);
  const [heroCurrency, setHeroCurrency] = useState("KES");
  const heroRate = BASE_RATES[heroCurrency];
  const heroQuote = useMemo(() => quote(heroAmount, heroRate), [heroAmount, heroRate]);

  return (
    <div className="flex flex-col w-full" style={{ fontFamily: SANS, color: T.ink }}>
      <MarketingHeader nav={LANDING_NAV} />

      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #171017 0%, ${T.ink} 55%, #241318 100%)`,
          color: "#fff",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.4,
            mixBlendMode: "overlay",
            backgroundImage:
              "url(\"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44NSIgbnVtT2N0YXZlcz0iMiIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNuKSIvPjwvc3ZnPg==\")",
          }}
        />
        <BackgroundArt tone="dark" style={{ opacity: 0.5 }} />
        <div className="relative grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-6 lg:px-12 py-20 lg:py-28 mx-auto w-full" style={{ maxWidth: 1180 }}>
          <div className="flex flex-col gap-6">
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full self-start" style={{ background: "rgba(255,255,255,0.1)", letterSpacing: "0.04em" }}>
              CROSS-BORDER TRANSFERS, DONE RIGHT
            </div>
            <h1 className="text-4xl lg:text-6xl leading-[1.05]" style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: "-0.02em" }}>{BRAND_TAGLINE}</h1>
            <p className="text-base lg:text-lg" style={{ color: "rgba(255,255,255,0.7)", maxWidth: 440 }}>
              {BRAND_FULL} moves money across borders at the real exchange rate, with one visible
              fee instead of a hidden markup — so more of every transfer actually arrives.
            </p>
            <div className="flex items-center gap-5 pt-2">
              <Button size="lg" style={{ borderRadius: 10 }} onClick={() => navigate("/register")}>
                Get started
              </Button>
              <a href="#how-it-works" className="flex items-center gap-2.5 text-sm font-medium" style={{ color: "#fff" }}>
                <span className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: "rgba(255,255,255,0.15)" }}>
                  <PlayCircle size={17} />
                </span>
                See how it works
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl p-6 flex flex-col gap-5" style={{ width: 360, background: T.surface, color: T.ink, boxShadow: shadow.lg }}>
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-medium" style={{ color: T.muted }}>You send</div>
                <div className="flex items-center gap-2 rounded-xl px-3" style={{ background: T.paper }}>
                  <input
                    type="number" min="0" value={heroAmount}
                    onChange={(e) => setHeroAmount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 py-3 text-lg font-semibold"
                    style={{ border: "none", outline: "none", width: "100%", background: "transparent" }}
                  />
                  <span className="text-xs font-semibold" style={{ color: T.muted }}>CAD</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-medium" style={{ color: T.muted }}>Recipient gets</div>
                <div className="flex items-center gap-2 rounded-xl px-3" style={{ background: T.paper }}>
                  <div className="flex-1 py-3 text-lg font-semibold">
                    {heroQuote.received.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </div>
                  <select
                    value={heroCurrency} onChange={(e) => setHeroCurrency(e.target.value)}
                    className="text-xs font-semibold"
                    style={{ border: "none", background: "transparent", color: T.muted }}
                  >
                    {CORRIDORS.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between text-xs" style={{ color: T.muted }}>
                <span>{rateFmt(heroRate)} Exchange rate</span>
                <span>{money(heroQuote.fee)} Fee</span>
              </div>
              <Button
                full icon={ArrowRight} onClick={() => navigate("/register")}
                style={{ borderRadius: 10 }}
              >
                Continue
              </Button>
              <div className="text-[11px] text-center" style={{ color: T.faint }}>
                Real rate, one visible fee — no account needed to see a quote.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 lg:px-12 py-20 lg:py-28 mx-auto w-full" style={{ maxWidth: 900 }}>
        <SectionHeading>How it works</SectionHeading>
        <div className="flex flex-col">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex gap-6 lg:gap-10 py-8" style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none" }}>
              <div className="text-3xl lg:text-4xl" style={{ fontFamily: DISPLAY, fontWeight: 600, color: T.line, flexShrink: 0, width: 56 }}>{s.n}</div>
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="text-lg font-semibold">{s.title}</div>
                <div className="text-sm" style={{ color: T.muted, maxWidth: 480 }}>{s.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="save" className="px-6 lg:px-12 py-20 lg:py-28" style={{ background: T.paper }}>
        <div className="mx-auto w-full" style={{ maxWidth: 900 }}>
          <SectionHeading>What you actually save</SectionHeading>
          <p className="text-sm mb-10 -mt-6" style={{ color: T.muted, maxWidth: 520 }}>
            Most transfers don't advertise their real cost — it's baked into a worse exchange
            rate. Here's what sending {money(SAMPLE_AMOUNT)} looks like, side by side.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl flex flex-col gap-3" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <div className="text-xs font-semibold" style={{ color: T.faint, letterSpacing: "0.04em" }}>TYPICAL BANK TRANSFER</div>
              <div className="text-3xl font-semibold" style={{ fontFamily: DISPLAY }}>~{money(bankCost)}</div>
              <div className="text-xs" style={{ color: T.muted }}>Flat fees plus a marked-up exchange rate, ~{(PRICING.bankBenchmark * 100).toFixed(1)}% of the transfer, rarely itemized.</div>
              <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: T.brick }}><X size={13} /> Rate isn't disclosed upfront</div>
            </div>
            <div className="p-6 rounded-2xl flex flex-col gap-3" style={{ background: T.ink, color: "#fff" }}>
              <div className="text-xs font-semibold" style={{ color: T.marigold, letterSpacing: "0.04em" }}>{BRAND_NAME.toUpperCase()}</div>
              <div className="text-3xl font-semibold" style={{ fontFamily: DISPLAY }}>{money(halcyonCost)}</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>One visible {(PRICING.feeRate * 100).toFixed(1)}% fee plus a disclosed {(PRICING.spread * 100).toFixed(2)}% FX spread — nothing hidden in the rate.</div>
              <div className="flex items-center gap-1.5 text-xs pt-1" style={{ color: T.marigold }}><Check size={13} /> You keep ~{money(bankCost - halcyonCost)}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="countries" className="px-6 lg:px-12 py-20 lg:py-28 mx-auto w-full" style={{ maxWidth: 900 }}>
        <SectionHeading>Send to the corridors that matter</SectionHeading>
        <div className="flex flex-col">
          {CORRIDORS.map((c, i) => (
            <div key={c.code} className="flex items-center justify-between py-5" style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none" }}>
              <div className="flex items-center gap-4">
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <div className="text-base font-medium">{c.country}</div>
                  <div className="text-xs" style={{ color: T.faint }}>{c.city}</div>
                </div>
              </div>
              <div className="text-sm" style={{ color: T.muted, fontFamily: MONO }}>1 CAD = {rateFmt(BASE_RATES[c.code])} {c.code}</div>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button icon={ArrowRight} onClick={() => navigate("/register")}>Start sending</Button>
        </div>
      </section>

      <section id="dashboard" className="px-6 lg:px-12 py-20 lg:py-28" style={{ background: T.paper }}>
        <div className="mx-auto w-full" style={{ maxWidth: 900 }}>
          <SectionHeading>Your money, in one clear view</SectionHeading>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start -mt-6">
            <div className="p-4 rounded-2xl" style={{ ...cardStyle, background: T.surface }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: T.muted }}>Wallet balance</span>
                <Shield size={14} style={{ color: T.faint }} />
              </div>
              <div className="text-3xl mb-3" style={{ fontFamily: DISPLAY, fontWeight: 600 }}>{money(1284.5)}</div>
              <div className="flex gap-2 mb-5">
                <Button size="sm" icon={Plus} variant="ghost" onClick={() => navigate("/register")}>Add funds</Button>
                <Button size="sm" icon={Send} style={{ background: T.marigold, color: T.ink, border: `1px solid ${T.marigold}` }} onClick={() => navigate("/register")}>Send</Button>
                <Button size="sm" icon={ArrowDownLeft} variant="ghost" onClick={() => navigate("/register")}>Receive</Button>
              </div>
              <div className="text-xs font-semibold mb-2" style={{ color: T.muted }}>Money in vs. out</div>
              <div className="relative" style={{ height: 140 }}>
                <div className="absolute inset-0"><MiniAreaChart data={SAMPLE_FLOW} seriesKey="added" color={T.pine} max={FLOW_MAX} height={140} /></div>
                <div className="absolute inset-0"><MiniAreaChart data={SAMPLE_FLOW} seriesKey="sent" color={T.brick} max={FLOW_MAX} height={140} /></div>
              </div>
              <div className="flex justify-between text-[10px] mt-1" style={{ color: T.faint }}>
                {SAMPLE_FLOW.map((d) => <span key={d.month}>{d.month}</span>)}
              </div>

              <div className="text-xs font-semibold mt-5 mb-2" style={{ color: T.muted }}>Recent activity</div>
              <div className="flex flex-col gap-2">
                {SAMPLE_TX.map((t) => <TxRow key={t.id} tx={t} onClick={() => {}} />)}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <p className="text-sm" style={{ color: T.muted }}>
                Balance, spending, and every transfer's status — the same dashboard you land on
                the moment you sign in. Shown here with sample data.
              </p>
              {DASHBOARD_CALLOUTS.map(([title, text]) => (
                <div key={title} className="flex gap-4">
                  <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, marginTop: 7, background: T.marigold }} />
                  <div>
                    <div className="text-base font-semibold">{title}</div>
                    <div className="text-sm" style={{ color: T.muted }}>{text}</div>
                  </div>
                </div>
              ))}
              <Button icon={ArrowRight} style={{ alignSelf: "flex-start" }} onClick={() => navigate("/register")}>Get your own dashboard</Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 lg:px-12 py-20 lg:py-28 mx-auto w-full" style={{ maxWidth: 1080 }}>
        <SectionHeading>Everything a cross-border transfer should be</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 -mt-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl flex flex-col gap-3" style={{ background: T.surface, border: `1px solid ${T.line}`, boxShadow: shadow.sm }}>
              <div className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: T.pineSoft, color: T.pine }}>
                <f.icon size={19} />
              </div>
              <div className="text-base font-semibold">{f.title}</div>
              <div className="text-sm" style={{ color: T.muted }}>{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="about-us" className="px-6 lg:px-12 py-20 lg:py-28" style={{ background: T.paper }}>
        <div className="mx-auto w-full" style={{ maxWidth: 900 }}>
          <SectionHeading>Who we are</SectionHeading>
          <p className="text-sm leading-relaxed -mt-6 mb-10" style={{ color: T.muted, maxWidth: 620 }}>
            {BRAND_FULL} exists because too much of every cross-border transfer disappears into a
            marked-up exchange rate nobody discloses upfront. We built the alternative: the real
            rate, one visible fee, and a straight line from sender to recipient — starting with
            the corridors that matter most to the communities we serve.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            {STATS.map(([value, label]) => (
              <div key={label} className="p-6 rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <div className="text-3xl" style={{ fontFamily: DISPLAY, fontWeight: 600, color: T.pine }}>{value}</div>
                <div className="text-xs mt-1" style={{ color: T.muted }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="p-6 rounded-2xl flex flex-col gap-3" style={{ background: T.surface, border: `1px solid ${T.line}`, boxShadow: shadow.sm }}>
                <div className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: T.pineSoft, color: T.pine }}>
                  <v.icon size={19} />
                </div>
                <div className="text-base font-semibold">{v.title}</div>
                <div className="text-sm" style={{ color: T.muted }}>{v.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="help" className="px-6 lg:px-12 py-20 lg:py-28 mx-auto w-full" style={{ maxWidth: 760 }}>
        <SectionHeading>Answers, before you need to ask</SectionHeading>
        <div className="flex flex-col gap-3 -mt-6 mb-10">
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-8 rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.line}`, boxShadow: shadow.sm }}>
          <div className="flex items-center gap-4">
            <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 44, height: 44, background: T.pineSoft, color: T.pine }}>
              <LifeBuoy size={20} />
            </div>
            <div>
              <div className="text-base font-semibold">Still need a hand?</div>
              <div className="text-sm" style={{ color: T.muted }}>Our support team replies within one business day.</div>
            </div>
          </div>
          <a href="mailto:support@halcyon.example" className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold flex-shrink-0" style={{ background: T.pine, color: "#fff" }}>
            <Mail size={15} /> Email support
          </a>
        </div>
      </section>

      <MarketingFooter columns={LANDING_FOOTER_COLUMNS} />
    </div>
  );
}
