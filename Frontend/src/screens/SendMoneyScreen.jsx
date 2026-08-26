import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Send } from "lucide-react";
import { T, inputStyle } from "../lib/theme.jsx";
import { money, rateFmt } from "../lib/format.js";
import { PAYOUT_METHODS } from "../lib/constants.js";
import { quote } from "../lib/pricing.js";
import { Button, TextInput, Field, ScreenHeader } from "../components/primitives.jsx";
import { useStore } from "../store/context.jsx";
import { select } from "../store/selectors.js";
import { api } from "../lib/api.js";

export default function SendMoneyScreen() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const userId = select.user(state)?.id;
  const beneficiaries = select.beneficiaries(state);
  const [beneficiaryId, setBeneficiaryId] = useState(beneficiaries[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mobile");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const beneficiary = select.beneficiaryById(state, beneficiaryId);
  const rate = beneficiary ? select.rate(state, beneficiary.currency) : 1;
  const q = useMemo(() => quote(amount, rate), [amount, rate]);
  const balance = select.balance(state);

  if (beneficiaries.length === 0) {
    return (
      <ScreenHeader title="Send money" onBack={() => navigate("/home")}>
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="text-sm" style={{ color: T.muted }}>Add a beneficiary before you send money.</div>
          <Button onClick={() => navigate("/beneficiaries")}>Add beneficiary</Button>
        </div>
      </ScreenHeader>
    );
  }

  const submit = async () => {
    if (!beneficiary) return setError("Choose who you're sending to.");
    if (!q.send) return setError("Enter an amount to send.");
    if (q.total > balance) return setError("That's more than your wallet balance.");
    setBusy(true); setError(null);
    try {
      const tx = await api.sendMoney(userId, { beneficiary, q, method });
      dispatch({ type: "transactions/transferRecorded", payload: tx });
      navigate(`/receipt/${tx.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenHeader title="Send money" onBack={() => navigate("/home")}>
      <div className="flex flex-col gap-4 p-5 pt-2">
        <Field label="To">
          <select value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} style={inputStyle}>
            {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.flag} {b.name}</option>)}
          </select>
        </Field>
        <Field label={`You send (CAD → ${beneficiary?.currency})`}>
          <TextInput type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Payout method">
          <div className="flex flex-col gap-2">
            {PAYOUT_METHODS.map((m) => (
              <button
                type="button" key={m.id} onClick={() => setMethod(m.id)}
                className="flex items-center gap-3 p-3 rounded-xl text-left"
                style={{ background: method === m.id ? T.pineSoft : T.surface, border: `1px solid ${method === m.id ? T.pine : T.line}` }}
              >
                <m.icon size={18} style={{ color: T.pine }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs" style={{ color: T.faint }}>{m.note} · ~{m.minutes < 60 ? `${m.minutes} min` : `${Math.round(m.minutes / 60)} hr`}</div>
                </div>
                {method === m.id && <Check size={16} style={{ color: T.pine }} />}
              </button>
            ))}
          </div>
        </Field>

        {q.send > 0 && (
          <div className="rounded-xl p-3 flex flex-col gap-1.5 text-xs" style={{ background: T.paper }}>
            <div className="flex justify-between"><span style={{ color: T.muted }}>Fee</span><span>{money(q.fee)}</span></div>
            <div className="flex justify-between"><span style={{ color: T.muted }}>Exchange rate</span><span>1 CAD = {rateFmt(rate)} {beneficiary?.currency}</span></div>
            <div className="flex justify-between font-semibold"><span>They receive</span><span>{money(q.received, beneficiary?.currency)}</span></div>
            <div className="flex justify-between" style={{ color: T.pine }}><span>You save vs. banks</span><span>{money(q.saved)}</span></div>
            <div className="flex justify-between font-semibold pt-1" style={{ borderTop: `1px solid ${T.line}` }}><span>Total charged</span><span>{money(q.total)}</span></div>
          </div>
        )}

        {error && <div className="flex items-center gap-2 text-xs" style={{ color: T.brick }}><AlertCircle size={14} />{error}</div>}
        <Button full loading={busy} icon={Send} onClick={submit}>Send {q.send > 0 ? money(q.total) : ""}</Button>
      </div>
  </ScreenHeader>
  );
}
