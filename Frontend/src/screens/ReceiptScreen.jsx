import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronLeft, Copy, X } from "lucide-react";
import { T, TONE, STATUS_TONE, MONO } from "../lib/theme.jsx";
import { money, fullDate, rateFmt } from "../lib/format.js";
import { PAYOUT_METHODS } from "../lib/constants.js";
import { OUTFLOW_TYPES } from "../components/primitives.jsx";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";

export default function ReceiptScreen() {
  const { state } = useStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const tx = select.transactionById(state, id);

  useEffect(() => {
    if (!tx) navigate("/home", { replace: true });
  }, [tx]);

  if (!tx) return null;

  const out = OUTFLOW_TYPES.has(tx.type);
  const abroad = tx.type === "send";
  const tone = TONE[STATUS_TONE[tx.status]] || TONE.muted;
  const rows = abroad
    ? [
        ["Recipient", tx.name],
        ["Amount sent", money(tx.amount)],
        ["Fee", money(tx.fee)],
        ["They receive", money(tx.received, tx.currency)],
        ["Rate", tx.rate ? `1 CAD = ${rateFmt(tx.rate)} ${tx.currency}` : "—"],
        ["Method", PAYOUT_METHODS.find((m) => m.id === tx.method)?.label || tx.method],
      ]
    : [["Description", tx.name], ["Amount", money(tx.amount, tx.currency)]];

  return (
    <div className="flex flex-col halcyon-rise" style={{ minHeight: "100%" }}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-2">
        <button onClick={() => navigate(out ? "/transactions" : "/home")} style={{ color: T.muted }}>
          <ChevronLeft size={20} />
        </button>
        <div className="text-base font-semibold flex-1">Receipt</div>
      </div>
      <div className="flex flex-col items-center gap-2 py-6">
        <div className="rounded-full flex items-center justify-center" style={{ width: 56, height: 56, background: tone.bg, color: tone.fg }}>
          {tx.status === "failed" ? <X size={26} /> : <Check size={26} />}
        </div>
        <div className="text-lg font-semibold capitalize">{tx.status}</div>
        <div className="text-xs" style={{ color: T.faint }}>{fullDate(tx.createdAt)}</div>
      </div>
      <div className="flex flex-col gap-3 p-5 rounded-t-2xl flex-1" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: T.muted }}>{label}</span><span className="font-medium">{val}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-2" style={{ borderTop: `1px solid ${T.line}` }}>
          <span style={{ color: T.muted }}>Reference</span>
          <span className="font-medium flex items-center gap-1" style={{ fontFamily: MONO }}>
            {tx.id}
            <button onClick={() => navigator.clipboard?.writeText(tx.id)} style={{ color: T.faint }}><Copy size={12} /></button>
          </span>
        </div>
      </div>
    </div>
  );
}
