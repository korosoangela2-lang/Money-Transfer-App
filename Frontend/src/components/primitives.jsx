import { useEffect } from "react";
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, Loader2 } from "lucide-react";
import { T, TONE, STATUS_TONE, inputStyle, cardStyle, shadow } from "../lib/theme.jsx";
import { money, shortDate } from "../lib/format.js";
import { useStore } from "../store/context.jsx";

export const Button = ({ children, variant = "primary", size = "md", full, icon: Icon, disabled, loading, style, ...rest }) => {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-3 text-sm", lg: "px-5 py-4 text-sm" };
  const styles = {
    primary: { background: T.pine, color: "#fff", border: `1px solid ${T.pine}`, boxShadow: shadow.sm },
    dark: { background: T.ink, color: "#fff", border: `1px solid ${T.ink}`, boxShadow: shadow.sm },
    ghost: { background: "transparent", color: T.ink, border: `1px solid ${T.line}` },
    quiet: { background: "transparent", color: T.muted, border: `1px solid transparent` },
    danger: { background: T.brickSoft, color: T.brick, border: `1px solid ${T.brickSoft}` },
  };
  return (
    <button
      disabled={disabled || loading}
      className={`${sizes[size]} ${full ? "w-full" : ""} inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-opacity`}
      style={{ ...styles[variant], opacity: disabled || loading ? 0.5 : 1, letterSpacing: "0.01em", ...style }}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="heha-spin" /> : Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
};

export const TextInput = ({ style, className, ...rest }) => (
  <input {...rest} style={{ ...inputStyle, ...style }} className={`heha-input ${className || ""}`} />
);

export const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5 w-full">
    <span className="text-xs font-medium" style={{ color: T.muted }}>{label}</span>
    {children}
  </label>
);

export const ScreenHeader = ({ title, onBack, right, children }) => (
  <div className="flex flex-col heha-rise" style={{ minHeight: "100%" }}>
    <div className="flex items-center gap-3 px-5 pt-5 pb-2">
      {onBack && (
        <button onClick={onBack} style={{ color: T.muted }}>
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="text-base font-semibold flex-1">{title}</div>
      {right}
    </div>
    {children}
  </div>
);

export const Pill = ({ tone = "muted", children }) => {
  const c = TONE[tone] || TONE.muted;
  return (
    <span className="text-[10px] font-semibold px-2 py-1 rounded-full capitalize" style={{ background: c.bg, color: c.fg }}>
      {children}
    </span>
  );
};

export const StatusPill = ({ status }) => <Pill tone={STATUS_TONE[status] || "muted"}>{status}</Pill>;

export const OUTFLOW_TYPES = new Set(["send", "p2p_out", "withdrawal"]);

export const TxRow = ({ tx, onClick }) => {
  const out = OUTFLOW_TYPES.has(tx.type);
  return (
    <button onClick={onClick} className="heha-card flex items-center gap-3 p-3 w-full text-left" style={cardStyle}>
      <div className="rounded-full flex items-center justify-center" style={{ width: 34, height: 34, background: out ? T.brickSoft : T.pineSoft, color: out ? T.brick : T.pine, flexShrink: 0 }}>
        {out ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{tx.name}</div>
        <div className="text-xs" style={{ color: T.faint }}>{shortDate(tx.createdAt)}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{out ? "-" : "+"}{money(tx.amount)}</div>
        <StatusPill status={tx.status} />
      </div>
    </button>
  );
};

export function Toast() {
  const { state, dispatch } = useStore();
  const toast = state.ui.toast;
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch({ type: "ui/toastCleared" }), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  const c = TONE[toast.tone === "error" ? "brick" : "pine"];
  return (
    <div
      className="heha-rise"
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: T.ink, color: "#fff", padding: "10px 16px", borderRadius: 12,
        fontSize: 13, fontWeight: 500, boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        zIndex: 100, maxWidth: "90vw", borderLeft: `3px solid ${c.fg}`,
      }}
    >
      {toast.message}
    </div>
  );
}
